# Budget

A private budgeting dashboard that reads an Excel file you keep yourself. Nothing is uploaded anywhere — your spreadsheet is read inside your own browser. There's no account to make, no server, and no internet connection involved once it's running.

It shows **several currencies side by side** without ever converting between them (CHF stays CHF, EUR stays EUR), tracks a balance per account, and cancels refunds against the original purchase even when the refund arrives in a different month.

Two looks, switchable from the header: **ledger** (the default, styled like a printed accounts book) and **classic** (a plain dashboard with a dark mode).

---

## Setting it up

**You don't need to know how to code to use this.** You do need to run a few commands once.

### 1. Install Node.js

If you've never used Node before, download the **LTS** version from [nodejs.org](https://nodejs.org) and install it. To check it worked, open Terminal (Mac) or Command Prompt (Windows) and type:

```bash
node --version
```

If it prints a number like `v22.11.0`, you're set.

### 2. Start the app

In Terminal, move into this folder and run these three commands, one at a time:

```bash
npm install        # once, the first time only — downloads what the app needs
npm run template   # creates budget-template.xlsx for you to fill in
npm run dev        # starts the app
```

The last one prints a web address, usually `http://localhost:5173`. Open it in your browser.

The app only works while that command is running. Leave the Terminal window open while you use it, and press `Ctrl+C` in it when you're done. Next time, `npm run dev` is the only command you need.

### 3. Put your numbers in

Open `budget-template.xlsx`, delete the example rows, and fill in your own — the layout is explained under [The spreadsheet](#the-spreadsheet) below. Then either:

- **drag the file onto the page**, every time you open the app, or
- **save it as `public/data/budget.xlsx`** and it opens automatically from then on.

Anything in the `public/data/` folder stays on your computer and is never committed to git.

Want to see what the app looks like before typing in a year of your own spending? `npm run mock` fills it with fake data.

### All the commands

| command | what it does |
| --- | --- |
| `npm run dev` | start the app |
| `npm run template` | create a blank `budget-template.xlsx` |
| `npm run mock` | fill the app with fake data to try it out |
| `npm run build` | package it up for hosting |
| `npm run preview` | check the packaged version |
| `npm run lint` | check the code (for developers) |

---

## Making it yours

**Open [`src/config.ts`](src/config.ts) in any text editor.** It's written for non-programmers, it explains each setting next to the setting itself, and it tells you the three rules for editing it without breaking anything. That file holds the app's name, the tagline, your date and number format, and which accounts count as savings.

The one worth changing immediately is `locale`, which controls how every date and amount is written — `pl-PL` gives you `1 234,50`, `de-CH` gives `1'234.50`, `en-GB` gives `1,234.50`.

Your **categories, accounts and currencies are not in that file** — they come from your spreadsheet. To add a category or start tracking a new currency, just type it into the spreadsheet. Nothing in the code needs to change.

---

## The spreadsheet

Your Excel file needs three tabs, named `Data`, `Accounts` and `Categories`. Column names must be spelled and capitalised exactly as below. If one is wrong, the app tells you which tab and which column rather than just showing an empty page.

### `Data` — one row per transaction

This is the tab you'll live in.

| column | needed? | what goes in it |
| --- | --- | --- |
| `Date` | **required** | a real date cell, or text like `05.11.2025` |
| `Amount` | **required** | **negative for spending**, positive for money coming in |
| `Currency` | **required** | `CHF`, `EUR`, `PLN`, `GBP`, `SEK` — any currency code |
| `Type` | optional | leave empty for normal spending; see below |
| `Category` | optional | the broad group, e.g. `Food` |
| `Subcategory` | optional | the detail, e.g. `groceries` |
| `Account` | optional | must match a name from the `Accounts` tab |
| `GroupID` | optional | links a refund to its purchase — see below |
| `Week` | optional | week number |
| `Context` | optional | free text, e.g. a trip name |
| `Description` | optional | free text, e.g. the shop |

**About `Type`:** leave it empty for ordinary spending. Write `Income` for money arriving, `Transfer` for moving money between your own accounts, and `Expense Return` for a refund. You can use your own language's words instead — they're listed in `src/config.ts`.

**About `Amount`:** spending must be negative. A grocery shop is `-45.30`, not `45.30`. This is the single most common mistake.

### `Accounts` — one row per account

| column | needed? | what goes in it |
| --- | --- | --- |
| `Account` | **required** | the name you use in the `Data` tab |
| `Currency` | **required** | one currency per account |
| `Type` | optional | write `Savings` here for savings accounts |
| `StartingBalance` | optional | what it held on `StartDate` |
| `StartDate` | optional | when you started tracking it |
| `Current balance` | optional | note the lowercase `b` |

If you have a savings account, adding the `Type` column and writing `Savings` in it is the reliable way to make the Savings Overview work. Without that column, the app guesses from the account's **name** instead, looking for the words listed in `savingsAccountWords` in `src/config.ts` — by default `sav`, `spar` and `oszcz`. **An empty Savings Overview is almost always this.**

### `Categories` — optional, sets the order

| column | needed? |
| --- | --- |
| `Subcategory` | **required** |
| `Category` | **required** |

List each subcategory next to the category it belongs to. The order of the rows here is the order categories appear in the app, so put them how you like to read them. Without this tab everything still works — you just don't control the ordering.

---

## Refunds that cross months

Buy a jacket for 65 EUR in November, return it in December, and you don't want November showing a 65 EUR jacket and December showing a mysterious +65.

Put the same `GroupID` on both rows — any label works, `G001`, `jacket`, anything, as long as the two match. The app cancels them against each other and attributes the result to the **original purchase's** month and category, so November correctly shows a jacket that cost nothing.

Leave `GroupID` empty for a refund that isn't tied to a particular purchase. It's then simply subtracted from the month it lands in.

---

## If something goes wrong

**The page is blank after editing `src/config.ts`.** You broke one of the three rules at the top of that file — most likely an apostrophe inside `'single quotes'`, or a deleted comma. Undo (`Ctrl+Z` / `Cmd+Z`), save, and it comes back.

**"This workbook has no sheet named Data".** A tab in your Excel file is named something else. Rename the tab, or change the names under `sheets` in `src/config.ts`.

**"The Data sheet is missing the column …".** Check the spelling and capitalisation in the header row — `date` is not `Date`.

**My expenses show as income.** Your amounts are positive. Spending has to be negative.

**The Savings Overview is empty.** See the `Accounts` section above.

**`npm: command not found`.** Node.js isn't installed — go back to step 1.

---

## Privacy

Your spreadsheet is read in the browser by [SheetJS](https://sheetjs.com) and never leaves your machine. The `public/data/` folder is excluded from git.

Two warnings worth taking seriously:

- If you publish this as a website, publish it **without** a spreadsheet in `public/data/` and drag yours in each time — otherwise you're putting your finances online.
- If you send this folder to someone as a **zip** rather than through git, check `public/data/` yourself first. The git exclusion doesn't protect you there.
