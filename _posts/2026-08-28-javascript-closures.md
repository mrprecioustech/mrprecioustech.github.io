---
layout: post
title: "JavaScript Closures, Finally Explained"
date: 2026-08-28 09:00:00 +0000
description: "Closures confuse every JavaScript developer exactly once. This is the explanation I wish I'd had — with practical examples you'll actually use."
tags: [javascript, webdev]
accent: amber
---

Every JavaScript developer hits the "closures" chapter, nods along pretending to understand, and then gets humbled by it in an interview two years later. Let's fix that properly — with examples you'll actually use, not just `for (var i...)` trivia.

## The one-sentence definition

**A closure is a function that remembers the variables from the scope where it was created — even after that scope has finished executing.**

That's it. Everything else is commentary. Let's prove it:

```javascript
function makeCounter() {
  let count = 0; // ← this variable "should" disappear when makeCounter returns

  return function () {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`makeCounter()` finished running on line 1 of the usage. But `count` is still alive, privately held by the returned function. That private, persistent memory **is** the closure.

## Why should you care?

Because closures are everywhere in real code:

### 1. Private state (without classes)

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() { return balance; },
  };
}

const account = createBankAccount(100);
account.deposit(50);      // 150
account.balance;          // undefined — truly private!
account.getBalance();     // 150
```

No `#private` syntax, no TypeScript, no classes — just a closure doing what closures do.

### 2. Function factories

```javascript
function greetWith(greeting) {
  return function (name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHello = greetWith("Hello");
const sayHi = greetWith("Hi");

sayHello("Ada"); // "Hello, Ada!"
sayHi("Grace");  // "Hi, Grace!"
```

Each returned function carries its own `greeting`. This pattern shows up constantly in middleware, event handlers, and configuration.

### 3. Debouncing (a real-world classic)

```javascript
function debounce(fn, delay) {
  let timerId; // ← shared across every call of the returned function

  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const search = debounce((query) => fetchResults(query), 300);
input.addEventListener("input", (e) => search(e.target.value));
```

The `timerId` persists between keystrokes because of the closure. Without it, you'd need a global variable or a class — messier either way.

## The classic gotcha (and why `let` fixed it)

You've probably seen this interview question:

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// logs: 3, 3, 3  😱
```

All three callbacks close over the **same** `i`, which is `3` by the time they run. The old-school fix was an IIFE; the modern fix is `let`, which creates a fresh binding per iteration:

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// logs: 0, 1, 2  ✅
```

Each iteration gets its own `i`, so each closure captures its own value. Mystery solved.

## The mental model

When you define a function in JavaScript, it doesn't just capture code — it captures a **backpack** containing references to all the variables in scope at that moment. Wherever the function goes (returned, passed as a callback, stored in an object), the backpack goes with it.

```javascript
function outer() {
  const backpack = "packed 🎒";
  return function inner() {
    console.log(backpack); // inner carries `backpack` wherever it goes
  };
}

const fn = outer();
fn(); // "packed 🎒"
```

> Closures don't copy values — they hold **references** to variables. If the variable changes later, the closure sees the new value. This is the source of both their power and 90% of closure bugs.
{: .callout}

## Quick self-test

What does this log, and why?

```javascript
function makeAdders() {
  const adders = [];
  for (var i = 1; i <= 3; i++) {
    adders.push(() => i * 10);
  }
  return adders;
}

const [a, b, c] = makeAdders();
console.log(a(), b(), c());
```

<details>
<summary>Click to reveal the answer</summary>

`40 40 40`. All three arrow functions close over the same `var i`, which equals `4` after the loop ends. Change `var` to `let` and you get `10 20 30`.

</details>

## Wrapping up

- A **closure** = a function + the variables it remembers from where it was defined.
- Use them for **private state**, **function factories**, and **callbacks that need memory** (debounce, event handlers, memoization).
- Remember they capture **references, not copies** — `let` vs `var` in loops is the classic trap.

Once you see closures, you can't unsee them: React hooks, Express middleware, module patterns — it's closures all the way down. And now you actually understand them. You're welcome, future interview-you.
