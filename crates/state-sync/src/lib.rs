//! # state-sync
//!
//! Minimal primitives for revision-based state synchronization.
//!
//! This crate provides the shared types used by the **invalidation-pull** protocol:
//! a [`Revision`] counter, a [`SnapshotEnvelope`] for transporting state, and an
//! [`InvalidationEvent`] for signaling changes.
//!
//! It does **not** impose a specific state manager or application architecture.
//! It exists as a safe, reusable foundation for a `revision + snapshot` protocol.
//!
//! ## Quick start (Tauri example)
//!
//! ```rust,ignore
//! use state_sync::{InvalidationEvent, Revision, SnapshotEnvelope};
//!
//! let rev = Revision::new(1);
//! let envelope = SnapshotEnvelope {
//!     revision: rev.to_string(),
//!     data: serde_json::json!({ "counter": 42 }),
//! };
//! ```

#![deny(missing_docs)]
#![deny(clippy::all)]
#![deny(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

use serde::{Deserialize, Serialize};
use std::fmt;

/// A monotonic state version backed by `u64`.
///
/// Revision must only move forward. Uses saturating arithmetic to avoid overflow.
///
/// ```
/// use state_sync::Revision;
///
/// let r = Revision::new(41);
/// assert_eq!(r.next().value(), 42);
/// assert_eq!(r.to_string(), "41");
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct Revision(u64);

impl Revision {
    /// Create a revision from a raw `u64`.
    #[must_use]
    pub const fn new(value: u64) -> Self {
        Self(value)
    }

    /// Get the raw `u64` value.
    #[must_use]
    pub const fn value(self) -> u64 {
        self.0
    }

    /// Next revision (saturating — never wraps to zero).
    #[must_use]
    pub const fn next(self) -> Self {
        Self(self.0.saturating_add(1))
    }
}

impl Default for Revision {
    /// Returns `Revision(0)`.
    fn default() -> Self {
        Self(0)
    }
}

impl fmt::Display for Revision {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u64> for Revision {
    fn from(value: u64) -> Self {
        Self(value)
    }
}

impl From<Revision> for u64 {
    fn from(rev: Revision) -> Self {
        rev.0
    }
}

/// A snapshot envelope carrying state data alongside its revision.
///
/// This is the canonical shape returned by `getSnapshot` commands.
/// The `data` field is generic — use your own app state type.
///
/// ```
/// use state_sync::SnapshotEnvelope;
///
/// let envelope = SnapshotEnvelope {
///     revision: "42".to_string(),
///     data: vec!["hello"],
/// };
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SnapshotEnvelope<T> {
    /// String representation of the revision (canonical `u64` decimal).
    pub revision: String,
    /// The state payload.
    pub data: T,
}

/// An invalidation event emitted when state changes.
///
/// The frontend subscribes to these events and pulls a fresh snapshot
/// when the revision is newer than the local one.
///
/// ```
/// use state_sync::InvalidationEvent;
///
/// let event = InvalidationEvent {
///     topic: "settings".to_string(),
///     revision: "42".to_string(),
/// };
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InvalidationEvent {
    /// Topic identifier (e.g. `"settings"`, `"user_profile"`).
    pub topic: String,
    /// String representation of the new revision.
    pub revision: String,
}

/// Compare two revision strings using the canonical `u64` decimal ordering.
///
/// Returns `Ordering::Less`, `Equal`, or `Greater`.
/// Longer strings represent larger numbers (no leading zeros assumed).
///
/// ```
/// use state_sync::compare_revisions;
/// use std::cmp::Ordering;
///
/// assert_eq!(compare_revisions("9", "10"), Ordering::Less);
/// assert_eq!(compare_revisions("42", "42"), Ordering::Equal);
/// assert_eq!(compare_revisions("100", "99"), Ordering::Greater);
/// ```
#[must_use]
pub fn compare_revisions(a: &str, b: &str) -> std::cmp::Ordering {
    a.len().cmp(&b.len()).then_with(|| a.cmp(b))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cmp::Ordering;

    #[test]
    fn revision_next() {
        let r = Revision::new(0);
        assert_eq!(r.next().value(), 1);
    }

    #[test]
    fn revision_saturating() {
        let r = Revision::new(u64::MAX);
        assert_eq!(r.next().value(), u64::MAX);
    }

    #[test]
    fn revision_display() {
        assert_eq!(Revision::new(42).to_string(), "42");
    }

    #[test]
    fn revision_from_u64() {
        let r: Revision = 10.into();
        assert_eq!(r.value(), 10);
    }

    #[test]
    fn compare_same_length() {
        assert_eq!(compare_revisions("42", "42"), Ordering::Equal);
        assert_eq!(compare_revisions("10", "20"), Ordering::Less);
        assert_eq!(compare_revisions("99", "10"), Ordering::Greater);
    }

    #[test]
    fn compare_different_length() {
        assert_eq!(compare_revisions("9", "10"), Ordering::Less);
        assert_eq!(compare_revisions("100", "99"), Ordering::Greater);
    }

    #[test]
    fn snapshot_envelope_serialize() {
        let envelope = SnapshotEnvelope {
            revision: "1".to_string(),
            data: 42,
        };
        let json = serde_json::to_string(&envelope).unwrap();
        assert!(json.contains("\"revision\":\"1\""));
        assert!(json.contains("\"data\":42"));
    }

    #[test]
    fn invalidation_event_serialize() {
        let event = InvalidationEvent {
            topic: "test".to_string(),
            revision: "5".to_string(),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"topic\":\"test\""));
        assert!(json.contains("\"revision\":\"5\""));
    }

    #[test]
    fn revision_default() {
        assert_eq!(Revision::default().value(), 0);
    }

    #[test]
    fn revision_ordering() {
        let a = Revision::new(1);
        let b = Revision::new(2);
        assert!(a < b);
        assert!(b > a);
        assert_eq!(a, Revision::new(1));
    }

    #[test]
    fn snapshot_envelope_roundtrip() {
        let original = SnapshotEnvelope {
            revision: "42".to_string(),
            data: vec![1, 2, 3],
        };
        let json = serde_json::to_string(&original).unwrap();
        let restored: SnapshotEnvelope<Vec<i32>> = serde_json::from_str(&json).unwrap();
        assert_eq!(original, restored);
    }

    #[test]
    fn invalidation_event_roundtrip() {
        let original = InvalidationEvent {
            topic: "settings".to_string(),
            revision: "100".to_string(),
        };
        let json = serde_json::to_string(&original).unwrap();
        let restored: InvalidationEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(original, restored);
    }

    #[test]
    fn compare_revisions_empty() {
        assert_eq!(compare_revisions("", ""), Ordering::Equal);
        assert_eq!(compare_revisions("", "0"), Ordering::Less);
        assert_eq!(compare_revisions("1", ""), Ordering::Greater);
    }

    #[test]
    fn revision_serde_transparent() {
        let rev = Revision::new(42);
        let json = serde_json::to_string(&rev).unwrap();
        assert_eq!(json, "42");
        let restored: Revision = serde_json::from_str("42").unwrap();
        assert_eq!(restored, rev);
    }

    #[test]
    fn compare_revisions_large() {
        assert_eq!(
            compare_revisions("18446744073709551615", "18446744073709551615"),
            Ordering::Equal,
        );
        assert_eq!(
            compare_revisions("18446744073709551614", "18446744073709551615"),
            Ordering::Less,
        );
    }
}
