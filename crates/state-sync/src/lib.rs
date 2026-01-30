//! `state-sync` (Rust helper)
//!
//! Минимальные примитивы для revision-based синхронизации.
//!
//! Важно: этот crate **не навязывает** конкретный state manager и не “тащит” архитектуру приложения.
//! Он нужен как безопасный, переиспользуемый фундамент для протокола `revision + snapshot`.

#![deny(missing_docs)]
#![deny(clippy::all)]
#![deny(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

/// Монотонная версия состояния.
///
/// Revision должна расти только вперёд (монотонно). Для защиты от переполнения используем saturating.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Revision(u64);

impl Revision {
    /// Создать revision из числа.
    #[must_use]
    pub const fn new(value: u64) -> Self {
        Self(value)
    }

    /// Получить raw значение.
    #[must_use]
    pub const fn value(self) -> u64 {
        self.0
    }

    /// Следующая revision (saturating).
    #[must_use]
    pub fn next(self) -> Self {
        Self(self.0.saturating_add(1))
    }
}

