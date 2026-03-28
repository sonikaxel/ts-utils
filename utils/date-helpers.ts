export type FinancialYear = {
  start: number;
  end: number;
  fy: string;
  date: {
    start: Date;
    end: Date;
  };
};

export function getFinancialYear(dateObj: Date): FinancialYear {
  const startMonthIndex = 3; // April as start of the Financial Year
  const currentYear = dateObj.getFullYear();
  const currentMonth = dateObj.getMonth(); // 0-indexed (Jan is 0, Apr is 3)

  let fiscalYearStart: number;

  // If the current month is before the financial year starts (e.g., Jan-Mar for an Apr start),
  // the financial year started in the previous calendar year.
  if (currentMonth < startMonthIndex) {
    fiscalYearStart = currentYear - 1;
  } else {
    fiscalYearStart = currentYear;
  }

  const fiscalYearEnd = fiscalYearStart + 1;

  return {
    start: fiscalYearStart,
    end: fiscalYearEnd,
    fy: `${fiscalYearStart}-${fiscalYearEnd}`,
    date: {
      start: new Date(`${fiscalYearStart}-04-01`),
      end: new Date(`${fiscalYearEnd}-03-31T23:59:59.999Z`),
    },
  };
}

export function getFinancialYearsForPeriod(fromDate:Date, toDate:Date): FinancialYear[] {
  const fromFy = getFinancialYear(fromDate);
  const toFy = getFinancialYear(toDate);

  let fys: FinancialYear[] = [];
  let start = fromFy.start;

  while (start < toFy.end) {
    fys.push(
      getFinancialYear(
        new Date(`${start}-04-01`)
      )
    );
    start++;
  }

  return fys;
}
