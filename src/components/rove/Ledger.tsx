import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { money } from "@/lib/rove/model";
import { BOOKS, BOOKS_AS_OF, POLITICAL_GIFTS, politicalTotal } from "@/lib/rove/books";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-linen text-ink">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-4 px-5 py-4">
          <Link to="/" className="font-display text-3xl leading-none tracking-tight text-ink">
            8020Ride
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/books" className="text-ink">
              Books
            </Link>
            <Link to="/" className="text-muted">
              Ride
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-8">{children}</article>
    </main>
  );
}

function Row({
  label,
  amount,
  note,
  href,
}: {
  label: string;
  amount: number;
  note?: string;
  href?: "/politics";
}) {
  const figure = <span className="font-display text-3xl tabular-nums">{money(amount)}</span>;
  return (
    <div className="border-b border-line py-4">
      <div className="flex items-baseline justify-between gap-6">
        {href ? (
          <Link to={href} className="underline">
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        )}
        {href ? (
          <Link to={href} className="text-ink">
            {figure}
          </Link>
        ) : (
          figure
        )}
      </div>
      {note ? <p className="mt-1 max-w-xl text-sm text-muted">{note}</p> : null}
    </div>
  );
}

export function BooksPage() {
  const politics = politicalTotal();
  return (
    <Shell>
      <p className="text-sm font-medium text-jade-deep">For-profit. Open books.</p>
      <h1 className="mt-2 font-display text-5xl leading-none">Books</h1>
      <p className="mt-4 max-w-xl text-muted">
        8020Ride is not a nonprofit. The books are published anyway, the way a nonprofit has to show where the money went. These are the amounts actually taken, paid, given, and kept. They are not a forecast, and they are not an auditor's report.
      </p>
      <p className="mt-2 text-sm text-muted">As of {BOOKS_AS_OF}. The page changes when the numbers change.</p>
      <div className="mt-8 border-t border-ink">
        <Row label="Proceeds to drivers" amount={BOOKS.driverProceeds} note="The drivers' share of fares. Nothing else." />
        <Row
          label="Employee pay, including bonuses"
          amount={BOOKS.employeePay}
          note="Wages and bonuses for everyone on payroll. C-suite salary is inside this number, and is also shown on its own line."
        />
        <Row label="C-suite salary" amount={BOOKS.cSuiteSalary} note="Already included in employee pay. Listed alone so it cannot hide there." />
        <Row label="Gifts to community nonprofits" amount={BOOKS.nonprofitGifts} />
        <Row
          label="Gifts to politicians"
          amount={politics}
          href="/politics"
          note="Each gift is named on the next page, with the reason it was given."
        />
        <Row
          label="Profit"
          amount={BOOKS.profit}
          note="What remains after the costs of running the company. Not a total of the lines above."
        />
      </div>
      <p className="mt-6 max-w-xl text-sm text-muted">
        No fare has been collected. No one has been paid. Nothing has been given to a nonprofit or a politician. Profit is zero.
      </p>
      <p className="mt-8 text-sm">
        <a className="underline" href="/privacy.html">
          Privacy
        </a>
        <span className="text-muted"> · </span>
        <a className="underline" href="/terms.html">
          Terms
        </a>
      </p>
    </Shell>
  );
}

export function PoliticsPage() {
  const gifts = POLITICAL_GIFTS;
  return (
    <Shell>
      <p className="text-sm">
        <Link to="/books" className="underline">
          Books
        </Link>
      </p>
      <h1 className="mt-3 font-display text-5xl leading-none">Gifts to politicians</h1>
      <p className="mt-4 max-w-xl text-muted">
        Money given to a candidate, a campaign, a party, a committee, or a ballot measure. A gift does not go out unless this page can say who received it and why.
      </p>
      {gifts.length === 0 ? (
        <p className="mt-8 border-t border-ink pt-4">None. The total is {money(0)}.</p>
      ) : (
        <table className="mt-8 w-full border-t border-ink text-left">
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th className="py-2 pr-3 font-medium">Who</th>
              <th className="py-2 pr-3 font-medium">Amount</th>
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 font-medium">Why</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((gift) => (
              <tr key={`${gift.date}-${gift.who}`} className="border-b border-line align-top">
                <td className="py-3 pr-3">{gift.who}</td>
                <td className="py-3 pr-3 tabular-nums">{money(gift.amount)}</td>
                <td className="py-3 pr-3">{gift.date}</td>
                <td className="py-3">{gift.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}
