# Flutter/Dart Code Review Checklist

Full checklist for `/supergraph:flutter-dart-code-review`. Reference this during Step 2 of the skill.

---

## 1. General Project Health

- [ ] Project follows consistent folder structure (feature-first or layer-first)
- [ ] Proper separation of concerns: UI, business logic, data layers
- [ ] No business logic in widgets; widgets are purely presentational
- [ ] `pubspec.yaml` is clean — no unused dependencies, versions pinned appropriately
- [ ] `analysis_options.yaml` includes a strict lint set with strict analyzer settings enabled
- [ ] No `print()` statements in production code — use `dart:developer` `log()` or a logging package
- [ ] Generated files (`.g.dart`, `.freezed.dart`, `.gr.dart`) are up-to-date or in `.gitignore`
- [ ] Platform-specific code isolated behind abstractions

---

## 2. Dart Language Pitfalls

- [ ] **Implicit dynamic**: Missing type annotations — enable `strict-casts`, `strict-inference`, `strict-raw-types`
- [ ] **Null safety misuse**: Excessive `!` instead of proper null checks or Dart 3 pattern matching
- [ ] **Type promotion failures**: Using `this.field` where local variable promotion would work
- [ ] **Catching too broadly**: `catch (e)` without `on` clause; always specify exception types
- [ ] **Catching `Error`**: `Error` subtypes indicate bugs and should not be caught
- [ ] **Unused `async`**: Functions marked `async` that never `await` — unnecessary overhead
- [ ] **`late` overuse**: Used where nullable or constructor initialization would be safer
- [ ] **String concatenation in loops**: Use `StringBuffer` instead of `+`
- [ ] **Ignoring `Future` return values**: Use `await` or explicitly call `unawaited()`
- [ ] **`var` where `final` works**: Prefer `final` for locals and `const` for compile-time constants
- [ ] **Relative imports**: Use `package:` imports for consistency
- [ ] **Mutable collections exposed**: Public APIs should return unmodifiable views
- [ ] **Missing Dart 3 pattern matching**: Prefer switch expressions and `if-case` over verbose `is` checks
- [ ] **Throwaway classes for multiple returns**: Use Dart 3 records `(String, int)` instead of single-use DTOs

---

## 3. Widget Best Practices

### Decomposition
- [ ] No single widget with a `build()` exceeding ~80-100 lines
- [ ] Widgets split by encapsulation AND by how they change (rebuild boundaries)
- [ ] Private `_build*()` helpers extracted to separate widget classes
- [ ] Stateless widgets preferred over Stateful where no mutable local state is needed

### Const usage
- [ ] `const` constructors used wherever possible — prevents unnecessary rebuilds
- [ ] `const` literals for collections that don't change

### Key usage
- [ ] `ValueKey` used in lists/grids to preserve state across reorders
- [ ] `GlobalKey` used sparingly
- [ ] `UniqueKey` avoided in `build()` — forces rebuild every frame

### Theming
- [ ] Colors from `Theme.of(context).colorScheme` — no hardcoded hex values
- [ ] Text styles from `Theme.of(context).textTheme`
- [ ] Dark mode compatibility verified

### Build method
- [ ] No network calls, file I/O, or heavy computation in `build()`
- [ ] No subscription creation (`.listen()`) in `build()`
- [ ] `setState()` localized to smallest possible subtree

---

## 4. State Management (Library-Agnostic)

### Architecture
- [ ] Business logic lives outside the widget layer
- [ ] State managers receive dependencies via injection, not by constructing them internally
- [ ] Service/repository layer abstracts data sources
- [ ] State managers have single responsibility — no "god" managers

### Immutability (BLoC, Riverpod, Redux)
- [ ] State objects are immutable — new instances via `copyWith()`, never mutated in-place
- [ ] State classes implement `==` and `hashCode` properly
- [ ] Collections inside state not exposed as raw mutable `List`/`Map`

### Reactivity (MobX, GetX, Signals)
- [ ] State mutated only through the solution's reactive API
- [ ] Derived values use the solution's computed mechanism
- [ ] Reactions and disposers properly cleaned up

### State shape design
- [ ] Mutually exclusive states use sealed types — not boolean flags (`isLoading`, `isError`)
- [ ] Every async operation models loading, success, error as distinct states
- [ ] All state variants handled exhaustively in UI
- [ ] Nullable data not used as a loading indicator

```dart
// BAD — boolean flag soup allows impossible states
class UserState {
  bool isLoading = false;
  bool hasError = false;
  User? user;
}

// GOOD — sealed types make impossible states unrepresentable
sealed class UserState {}
class UserInitial extends UserState {}
class UserLoading extends UserState {}
class UserLoaded extends UserState {
  final User user;
  const UserLoaded(this.user);
}
class UserError extends UserState {
  final String message;
  const UserError(this.message);
}
```

### Rebuild optimization
- [ ] Consumer widgets scoped as narrow as possible
- [ ] Selectors used to rebuild only when specific fields change

### Subscriptions & disposal
- [ ] All manual subscriptions (`.listen()`) cancelled in `dispose()` / `close()`
- [ ] Stream controllers closed when no longer needed
- [ ] `mounted` check before `setState` in async callbacks
- [ ] `BuildContext` not used after `await` without checking `context.mounted`
- [ ] `BuildContext` never stored in singletons or static fields

---

## 5. Performance

- [ ] `setState()` not called at root widget level — localize state changes
- [ ] `RepaintBoundary` used around complex subtrees that repaint independently
- [ ] `AnimatedBuilder` child parameter used for subtrees independent of animation
- [ ] No sorting, filtering, or mapping large collections in `build()`
- [ ] `MediaQuery.of(context)` usage is specific (e.g., `MediaQuery.sizeOf(context)`)
- [ ] Network images use caching
- [ ] `ListView.builder` / `GridView.builder` for large or dynamic lists
- [ ] `Opacity` widget avoided in animations — use `AnimatedOpacity` or `FadeTransition`

---

## 6. Testing

- [ ] **Unit tests**: All business logic (state managers, repositories, utilities)
- [ ] **Widget tests**: Individual widget behavior and interactions
- [ ] **Integration tests**: Critical user flows end-to-end
- [ ] **Golden tests**: Pixel-perfect comparisons for design-critical UI
- [ ] 80%+ line coverage on business logic
- [ ] All state transitions have corresponding tests
- [ ] External dependencies mocked or faked
- [ ] Tests run in CI and failures block merges

---

## 7. Accessibility

- [ ] `Semantics` widget used where automatic labels are insufficient
- [ ] All interactive elements focusable with meaningful descriptions
- [ ] Contrast ratio >= 4.5:1 for text
- [ ] Tappable targets at least 48x48 pixels
- [ ] Color is not the sole indicator of state
- [ ] Text scales with system font size settings

---

## 8. Platform-Specific Concerns

- [ ] Platform-adaptive widgets used where appropriate
- [ ] Back navigation handled correctly (Android back button, iOS swipe-to-go-back)
- [ ] `SafeArea` used for status bar and safe areas
- [ ] `LayoutBuilder` or `MediaQuery` for responsive layouts
- [ ] Text doesn't overflow on small screens — use `Flexible`, `Expanded`, `FittedBox`

---

## 9. Security

- [ ] Sensitive data stored using platform-secure storage (Keychain/EncryptedSharedPreferences)
- [ ] API keys NOT hardcoded — use `--dart-define`, `.env` excluded from VCS, or backend proxy
- [ ] All user input validated before sending to API
- [ ] Deep link URLs validated and sanitized
- [ ] HTTPS enforced for all API calls
- [ ] No sensitive data logged or printed

---

## 10. Package/Dependency Review

- [ ] pub points score 130+/160, verified publisher, active maintenance
- [ ] Caret syntax (`^1.2.3`) for version constraints
- [ ] No dependency overrides in production `pubspec.yaml`
- [ ] Internal packages import only from public API — no `package:other/src/internal.dart`

---

## 11. Navigation and Routing

- [ ] One routing approach used consistently — no mixing imperative and declarative
- [ ] Route arguments are typed — no `Map<String, dynamic>` casting
- [ ] Route paths defined as constants/enums — no magic strings
- [ ] Auth guards centralized, not duplicated across screens
- [ ] Deep links configured for both Android and iOS

---

## 12. Error Handling

- [ ] `FlutterError.onError` overridden for framework errors
- [ ] `PlatformDispatcher.instance.onError` set for unhandled async errors
- [ ] `ErrorWidget.builder` customized for release mode
- [ ] Error reporting service integrated (Crashlytics, Sentry, or equivalent)
- [ ] API errors result in user-friendly error UI, not crashes
- [ ] Raw exceptions mapped to localized messages before reaching UI

---

## 13. Internationalization (l10n)

- [ ] All user-visible strings use the localization system — no hardcoded strings
- [ ] ICU message syntax for plurals, genders, selects
- [ ] Date, time, number, currency formatting is locale-aware
- [ ] No string concatenation for localized text — use parameterized messages

---

## 14. Dependency Injection

- [ ] Classes depend on abstractions, not concrete implementations at layer boundaries
- [ ] Dependencies provided externally via constructor or DI framework
- [ ] Registration distinguishes lifetime: singleton vs factory vs lazy singleton
- [ ] No circular dependencies in the DI graph

---

## 15. Static Analysis

- [ ] `analysis_options.yaml` with `strict-casts: true`, `strict-inference: true`, `strict-raw-types: true`
- [ ] No unresolved analyzer warnings in committed code
- [ ] `// ignore:` suppressions justified with comments
- [ ] `flutter analyze` runs in CI and failures block merges
- [ ] Key rules: `prefer_const_constructors`, `avoid_print`, `unawaited_futures`, `prefer_final_locals`

---

## State Management Quick Reference

| Principle    | BLoC/Cubit          | Riverpod                   | Provider         | GetX               | MobX               | Signals      |
|---|---|---|---|---|---|---|
| Container    | `Bloc`/`Cubit`      | `Notifier`/`AsyncNotifier` | `ChangeNotifier` | `GetxController`   | `Store`            | `signal()`   |
| UI consumer  | `BlocBuilder`       | `ConsumerWidget`           | `Consumer`       | `Obx`/`GetBuilder` | `Observer`         | `Watch`      |
| Selector     | `BlocSelector`      | `ref.watch(p.select(...))` | `Selector`       | N/A                | computed           | `computed()` |
| Side effects | `BlocListener`      | `ref.listen`               | Consumer callback| `ever()`/`once()`  | `reaction`         | `effect()`   |
| Disposal     | auto via `BlocProvider` | `.autoDispose`         | auto via Provider| `onClose()`        | `ReactionDisposer` | manual       |
| Testing      | `blocTest()`        | `ProviderContainer`        | ChangeNotifier   | `Get.put` in test  | store directly     | signal directly |

---

## Sources

- [Effective Dart](https://dart.dev/effective-dart/style)
- [Flutter Performance Best Practices](https://docs.flutter.dev/perf/best-practices)
- [Flutter Testing Overview](https://docs.flutter.dev/testing/overview)
- [Flutter Accessibility](https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility)
- [Flutter State Management](https://docs.flutter.dev/data-and-backend/state-mgmt/options)
