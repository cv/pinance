/**
 * Facts about the data providers pinance supports, as data shared by pinance.get, pinance.providers, pinance.choose,
 */
async function registry(): Promise<{
  preferenceVariable: string;
  readSettingShell: string;
  providers: {
    id: "financialdatasets" | "equibles";
    name: string;
    namespace: "fd" | "eq";
    aliases: string[];
    baseUrl: string;
    keyName: string;
    authHeader: string;
    signup: string;
    pathPattern: string;
    upperCaseParams: string[];
    timeoutSeconds: number;
    hints: { [status: string]: string };
  }[];
}> {
  return {
    preferenceVariable: "PINANCE_PROVIDER",
    // Sets $v to a setting from the environment, else from .env, without printing it. NAME stands for the variable.
    readSettingShell:
      'v="${NAME:-}"; if [ -z "$v" ] && [ -f .env ]; then v=$(sed -n -e "s/^export //" -e "s/^NAME=//p" .env | tail -n 1 | tr -d "\\r\\"\'"); fi',
    providers: [
      {
        id: "financialdatasets",
        name: "Financial Datasets",
        namespace: "fd",
        aliases: ["fd", "financialdatasets"],
        baseUrl: "https://api.financialdatasets.ai",
        keyName: "FINANCIAL_DATASETS_API_KEY",
        authHeader: "x-api-key: %s",
        signup: "https://financialdatasets.ai/",
        pathPattern: "^/[a-z0-9\\-/]*$",
        upperCaseParams: ["ticker"],
        timeoutSeconds: 60,
        hints: {
          "401": "The API key appears to be invalid. Check FINANCIAL_DATASETS_API_KEY.",
          "403": "Access denied. The API key may not have access to this endpoint.",
          "404": "Data not found. The ticker symbol or requested data may not exist.",
          "429":
            "Rate limit exceeded. Wait a moment, or upgrade the plan at https://financialdatasets.ai/.",
          "5xx": "The Financial Datasets API is having issues. Try again later.",
        },
      },
      {
        id: "equibles",
        name: "Equibles",
        namespace: "eq",
        aliases: ["eq", "equibles"],
        baseUrl: "https://api.equibles.com",
        keyName: "EQUIBLES_API_KEY",
        authHeader: "Authorization: Bearer %s",
        signup: "https://equibles.com/dashboard/apikeys",
        pathPattern: "^/v1/[A-Za-z0-9\\-._~/%:]*$",
        upperCaseParams: ["ticker", "tickers"],
        // Valuation snapshots can take over a minute when not cached.
        timeoutSeconds: 150,
        hints: {
          "401": "The API key appears to be invalid. Check EQUIBLES_API_KEY.",
          "403": "Access denied. The plan may not include this dataset.",
          "404": "Data not found. The ticker symbol or requested data may not exist.",
          "429":
            "Daily request allowance used up; it resets at 00:00 UTC (see https://equibles.com/pricing).",
          "5xx": "The Equibles API is having issues. Try again later.",
        },
      },
    ],
  };
}
