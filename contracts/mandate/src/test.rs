#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (Env, MandateContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(MandateContract, ());
    let client = MandateContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let asset_contract = env.register_stellar_asset_contract_v2(token_admin);
    let asset = asset_contract.address();

    (env, client, asset)
}

fn fund_and_approve(
    env: &Env,
    asset: &Address,
    owner: &Address,
    spender_contract: &Address,
    amount: i128,
) {
    let token = token::StellarAssetClient::new(env, asset);
    token.mint(owner, &amount);

    let token_client = token::TokenClient::new(env, asset);
    token_client.approve(owner, spender_contract, &amount, &1000);
}

#[test]
fn create_and_read_mandate() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &asset, &1000_i128, &1000_u32);
    assert_eq!(mandate_id, 0);

    let mandate = client.get_mandate(&mandate_id);
    assert_eq!(mandate.owner, owner);
    assert_eq!(mandate.spender, spender);
    assert_eq!(mandate.asset, asset);
    assert_eq!(mandate.limit, 1000);
    assert_eq!(mandate.spent, 0);
    assert!(!mandate.revoked);
}

#[test]
fn spend_within_limit_moves_tokens_and_updates_spent() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    fund_and_approve(&env, &asset, &owner, &client.address, 1000);

    let mandate_id = client.create_mandate(&owner, &spender, &asset, &1000_i128, &1000_u32);
    client.spend(&mandate_id, &400_i128, &destination);

    let mandate = client.get_mandate(&mandate_id);
    assert_eq!(mandate.spent, 400);

    let token_client = token::TokenClient::new(&env, &asset);
    assert_eq!(token_client.balance(&destination), 400);
    assert_eq!(token_client.balance(&owner), 600);
}

#[test]
fn spend_over_limit_fails() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    fund_and_approve(&env, &asset, &owner, &client.address, 500);

    let mandate_id = client.create_mandate(&owner, &spender, &asset, &500_i128, &1000_u32);

    let result = client.try_spend(&mandate_id, &600_i128, &destination);
    assert_eq!(result, Err(Ok(Error::LimitExceeded)));
}

#[test]
fn spend_without_allowance_fails() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    // Mandate created, but the owner never approved the contract as a token spender.
    let mandate_id = client.create_mandate(&owner, &spender, &asset, &1000_i128, &1000_u32);

    let result = client.try_spend(&mandate_id, &100_i128, &destination);
    assert_eq!(result, Err(Ok(Error::AllowanceTooLow)));
}

#[test]
fn revoke_blocks_further_spend() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    fund_and_approve(&env, &asset, &owner, &client.address, 1000);

    let mandate_id = client.create_mandate(&owner, &spender, &asset, &1000_i128, &1000_u32);
    client.revoke(&mandate_id);

    let result = client.try_spend(&mandate_id, &100_i128, &destination);
    assert_eq!(result, Err(Ok(Error::Revoked)));
}

#[test]
fn spend_after_expiration_fails() {
    let (env, client, asset) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    fund_and_approve(&env, &asset, &owner, &client.address, 1000);

    let mandate_id = client.create_mandate(&owner, &spender, &asset, &1000_i128, &10_u32);
    env.ledger().with_mut(|li| li.sequence_number = 11);

    let result = client.try_spend(&mandate_id, &100_i128, &destination);
    assert_eq!(result, Err(Ok(Error::Expired)));
}

#[test]
fn get_mandate_not_found() {
    let (_env, client, _asset) = setup();
    let result = client.try_get_mandate(&42_u64);
    assert_eq!(result, Err(Ok(Error::NotFound)));
}
