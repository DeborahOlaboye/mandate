#![no_std]
use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, Env};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Mandate {
    pub owner: Address,
    pub spender: Address,
    pub limit: i128,
    pub spent: i128,
    pub expiration_ledger: u32,
    pub revoked: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Mandate(u64),
    NextId,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MandateCreated {
    #[topic]
    pub mandate_id: u64,
    pub owner: Address,
    pub spender: Address,
    pub limit: i128,
    pub expiration_ledger: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MandateSpent {
    #[topic]
    pub mandate_id: u64,
    pub destination: Address,
    pub amount: i128,
    pub spent_total: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MandateRevoked {
    #[topic]
    pub mandate_id: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    /// Mandate not found
    NotFound = 1,
    /// Mandate has been revoked
    Revoked = 2,
    /// Mandate has expired
    Expired = 3,
    /// Insufficient mandate balance for this spend
    LimitExceeded = 4,
    /// Amount must be greater than zero
    InvalidAmount = 5,
}

#[contract]
pub struct MandateContract;

#[contractimpl]
impl MandateContract {
    /// Create a new spending mandate. Only the owner can authorize creating a
    /// mandate that grants `spender` the right to spend up to `limit` before
    /// `expiration_ledger`.
    pub fn create_mandate(
        env: Env,
        owner: Address,
        spender: Address,
        limit: i128,
        expiration_ledger: u32,
    ) -> Result<u64, Error> {
        owner.require_auth();

        if limit <= 0 {
            return Err(Error::InvalidAmount);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0);

        let mandate = Mandate {
            owner: owner.clone(),
            spender: spender.clone(),
            limit,
            spent: 0,
            expiration_ledger,
            revoked: false,
        };

        env.storage().persistent().set(&DataKey::Mandate(id), &mandate);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        MandateCreated {
            mandate_id: id,
            owner,
            spender,
            limit,
            expiration_ledger,
        }
        .publish(&env);

        Ok(id)
    }

    /// Spend against an existing mandate. Only the mandate's spender can call
    /// this, and only up to the remaining (limit - spent) balance.
    pub fn spend(env: Env, mandate_id: u64, amount: i128, destination: Address) -> Result<(), Error> {
        let mut mandate: Mandate = env
            .storage()
            .persistent()
            .get(&DataKey::Mandate(mandate_id))
            .ok_or(Error::NotFound)?;

        mandate.spender.require_auth();

        if mandate.revoked {
            return Err(Error::Revoked);
        }
        if env.ledger().sequence() > mandate.expiration_ledger {
            return Err(Error::Expired);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if mandate.spent + amount > mandate.limit {
            return Err(Error::LimitExceeded);
        }

        mandate.spent += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Mandate(mandate_id), &mandate);

        MandateSpent {
            mandate_id,
            destination,
            amount,
            spent_total: mandate.spent,
        }
        .publish(&env);

        Ok(())
    }

    /// Revoke a mandate. Only the owner can revoke it.
    pub fn revoke(env: Env, mandate_id: u64) -> Result<(), Error> {
        let mut mandate: Mandate = env
            .storage()
            .persistent()
            .get(&DataKey::Mandate(mandate_id))
            .ok_or(Error::NotFound)?;

        mandate.owner.require_auth();

        mandate.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Mandate(mandate_id), &mandate);

        MandateRevoked { mandate_id }.publish(&env);

        Ok(())
    }

    /// Read-only lookup of a mandate's current state.
    pub fn get_mandate(env: Env, mandate_id: u64) -> Result<Mandate, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Mandate(mandate_id))
            .ok_or(Error::NotFound)
    }
}

mod test;
