export interface InvestmentTopic {
  id: string;
  title: string;
  description: string;
  link: string;
}

export const INVESTMENT_RESOURCES: InvestmentTopic[] = [
  {
    id: 'inv-1',
    title: 'Daily Market News & Stock Trends',
    description: 'Check global indices, market sentiment, top gainers/losers, and macroeconomic indicators.',
    link: 'https://finance.yahoo.com',
  },
  {
    id: 'inv-2',
    title: 'Index Funds & ETF Investing Basics',
    description: 'Learn dollar-cost averaging, low-cost index funds, and long-term asset allocation strategy.',
    link: 'https://www.investopedia.com/etfs-4427785',
  },
  {
    id: 'inv-3',
    title: 'Tech & AI Industry Market Analysis',
    description: 'Follow cloud computing, AI hardware, semiconductor, and SaaS valuation metrics.',
    link: 'https://techcrunch.com',
  },
];

export const DAILY_INVESTMENT_CHECKLIST = [
  'Review 10-Min Market Headlines & Global Trends',
  'Track Monthly SIP / ETF Investment Allocation',
  'Read 1 Financial Literacy Article or Company Brief',
  'Update Personal Investment Watchlist Notes',
];

