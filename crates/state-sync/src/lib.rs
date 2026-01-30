//! `state-sync` (Rust helper)
//!
//! Minimal primitives for revision-based synchronization.
//!
//! Important: this crate does **not** impose a specific state manager or “drag in” an application
//! architecture. It exists as a safe, reusable foundation for a `revision + snapshot` protocol.

#![deny(missing_docs)]
#![deny(clippy::all)]
#![deny(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

/// A monotonic state version.
///
/// Revision must only move forward (monotonic). We use saturating arithmetic to avoid overflow.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Revision(u64);

impl Revision {
    /// Create a revision from a number.
    #[must_use]
    pub const fn new(value: u64) -> Self {
        Self(value)
    }

    /// Get the raw value.
    #[must_use]
    pub const fn value(self) -> u64 {
        self.0
    }

    /// Next revision (saturating).
    #[must_use]
    pub fn next(self) -> Self {
        Self(self.0.saturating_add(1))
    }
}
