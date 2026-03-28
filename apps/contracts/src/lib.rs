#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct ChordiallyContract;

#[contractimpl]
impl ChordiallyContract {
    pub fn health(env: Env) -> u32 {
        env.events().publish(("health",), 1u32);
        1
    }
}
