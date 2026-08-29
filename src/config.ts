/**
 * ═══════════════════════════════════════════════════════════════
 *   YOUR SETTINGS — this is the only file you need to edit
 * ═══════════════════════════════════════════════════════════════
 *
 * Every setting below has a working default, so change only what
 * you care about.
 *
 * ── Three rules for editing safely ─────────────────────────────
 *
 *   1. Only change what's between the 'quote marks', or the plain
 *      numbers. Leave the word before the colon alone.
 *
 *         appName: 'The Ledger',
 *         ↑ leave    ↑ change this
 *
 *   2. Keep the comma at the end of the line.
 *
 *   3. If your text contains an apostrophe, switch to "double
 *      quotes", or the app will break:
 *
 *         appName: "Anna's budget",     ← works
 *         appName: 'Anna's budget',     ← breaks
 *
 * If the page goes blank after an edit, you've hit one of the three.
 * Undo the change (Ctrl+Z / Cmd+Z), save, and it comes straight back.
 *
 * ── What is NOT set here ───────────────────────────────────────
 *
 * Your categories, subcategories, accounts and currencies are not
 * in this file. Those come from your Excel workbook — to add a
 * category or a currency, just type it in the spreadsheet. See
 * README.md for the workbook layout.
 */

export const config: AppConfig = {

  // ─────────────────────────────────────────────────────────────
  //   What your budget is called
  // ─────────────────────────────────────────────────────────────

  /** The title, shown on the opening page, in the header, and in the browser tab. */
  appName: 'The Ledger',

  /** The italic line just under the title on the opening page. */
  tagline: 'a private account of monies kept & spent',

  /** The small line at the very bottom of the opening page. */
  colophon: 'kept by hand · marked & sealed',

  /**
   * The year you started keeping this budget.
   * It only decides the "volume" number on the opening page — start in
   * 2023 and this year is volume III. If you're starting now, put this
   * year here.
   */
  firstYear: 2023,

  // ─────────────────────────────────────────────────────────────
  //   Language and number formatting
  // ─────────────────────────────────────────────────────────────

  /**
   * Sets how ALL dates and amounts are written throughout the app.
   * Use your country's code — a language, a dash, a country:
   *
   *   'en-GB'  →  1,234.50   ·  12 Nov 2025
   *   'de-CH'  →  1'234.50   ·  12 Nov 2025
   *   'pl-PL'  →  1 234,50   ·  12 lis 2025
   *   'de-DE'  →  1.234,50   ·  12. Nov. 2025
   *   'fr-FR'  →  1 234,50   ·  12 nov. 2025
   *   'en-US'  →  1,234.50   ·  Nov 12, 2025
   *
   * This does not translate the app — the buttons and headings stay
   * in English.
   */
  locale: 'en-GB',

  /**
   * The words you're allowed to write in the `Type` column of your
   * spreadsheet, so you can keep your budget in your own language.
   * Capital letters don't matter.
   *
   * Anything you write that isn't in these lists counts as an ordinary
   * expense — which is what most rows are, so you can leave the Type
   * column empty for normal spending.
   *
   * (The Polish words are an example of adding a second language.
   * Delete them if you don't need them, you can also add Dutch/German if you prefer.)
   */
  transactionTypes: {
    income: ['income', 'przychód', 'przychod'],
    transfer: ['transfer', 'przelew'],
    expenseReturn: ['expense return', 'expensereturn', 'return', 'refund', 'zwrot'],
  },

  // ─────────────────────────────────────────────────────────────
  //   Your spreadsheet
  // ─────────────────────────────────────────────────────────────

  /**
   * The file the app opens automatically when you start it.
   * Put your spreadsheet at  public/data/budget.xlsx  and it loads
   * on its own — otherwise you drag it onto the page each time.
   *
   * Everything inside public/data/ stays on your computer and is never
   * committed to git, so your numbers don't travel with the code.
   *
   * To use a different filename, change the last part below and put
   * your file in that same public/data/ folder.
   */
  dataFile: '/data/budget.xlsx',

  /**
   * Which account names count as savings, for the Savings Overview on
   * the Accounts page. A name counts if it CONTAINS any word below —
   * 'sav' matches "Savings", "UBS Save" and "saving pot" alike.
   *
   * The tidier alternative: add a `Type` column to your Accounts sheet
   * and write Savings in it. When that column exists, this list is
   * ignored entirely.
   *
   * If your Savings Overview is empty, this is almost always why.
   */
  savingsAccountWords: ['sav', 'spar', 'oszcz'],

  /**
   * The names of the three tabs inside your Excel file.
   * Only change these if you want to rename the tabs in your own
   * spreadsheet — the app has to know what you called them.
   */
  sheets: {
    transactions: 'Data',
    accounts: 'Accounts',
    categories: 'Categories',
  },

  /** What to call a transaction that has no category filled in. */
  fallbackLabels: {
    category: 'Uncategorized',
    subcategory: 'Other',
  },
};

/**
 * ═══════════════════════════════════════════════════════════════
 *   Below here is for the computer, not for you.
 *
 *   This part tells the app what kind of value each setting holds
 *   (text, a number, a list). There's nothing to change here — your
 *   settings are all in the block above.
 * ═══════════════════════════════════════════════════════════════
 */
export interface AppConfig {
  appName: string;
  tagline: string;
  colophon: string;
  firstYear: number;
  locale: string;
  transactionTypes: {
    income: string[];
    transfer: string[];
    expenseReturn: string[];
  };
  dataFile: string;
  savingsAccountWords: string[];
  sheets: {
    transactions: string;
    accounts: string;
    categories: string;
  };
  fallbackLabels: {
    category: string;
    subcategory: string;
  };
}
