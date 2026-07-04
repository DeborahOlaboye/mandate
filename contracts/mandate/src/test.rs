#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (Env, Address, MandateContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(MandateContract, ());
    let client = MandateContractClient::new(&env, &contract_id);
    (env, contract_id, client)
}

#[test]
fn create_and_read_mandate() {
    let (env, _id, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &1000_i128, &1000_u32);
    assert_eq!(mandate_id, 0);

    let mandate = client.get_mandate(&mandate_id);
    assert_eq!(mandate.owner, owner);
    assert_eq!(mandate.spender, spender);
    assert_eq!(mandate.limit, 1000);
    assert_eq!(mandate.spent, 0);
    assert!(!mandate.revoked);
}

#[test]
fn spend_within_limit_updates_spent() {
    let (env, _id, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &1000_i128, &1000_u32);
    client.spend(&mandate_id, &400_i128, &destination);

    let mandate = client.get_mandate(&mandate_id);
    assert_eq!(mandate.spent, 400);
}

#[test]
fn spend_over_limit_fails() {
    let (env, _id, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &500_i128, &1000_u32);

    let result = client.try_spend(&mandate_id, &600_i128, &destination);
    assert_eq!(result, Err(Ok(Error::LimitExceeded)));
}

#[test]
fn revoke_blocks_further_spend() {
    let (env, _id, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &1000_i128, &1000_u32);
    client.revoke(&mandate_id);

    let result = client.try_spend(&mandate_id, &100_i128, &destination);
    assert_eq!(result, Err(Ok(Error::Revoked)));
}

#[test]
fn spend_after_expiration_fails() {
    let (env, _id, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let destination = Address::generate(&env);

    let mandate_id = client.create_mandate(&owner, &spender, &1000_i128, &10_u32);
    env.ledger().with_mut(|li| li.sequence_number = 11);

    let result = client.try_spend(&mandate_id, &100_i128, &destination);
    assert_eq!(result, Err(Ok(Error::Expired)));
}

#[test]
fn get_mandate_not_found() {
    let (_env, _id, client) = setup();
    let result = client.try_get_mandate(&42_u64);
    assert_eq!(result, Err(Ok(Error::NotFound)));
}
