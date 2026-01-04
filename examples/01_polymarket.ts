import { PolymarketSDK } from "@catalyst-team/poly-sdk";

// 只读操作无需认证
const sdk = new PolymarketSDK();

// 通过 slug 或 condition ID 获取市场
const market = await sdk.getMarket(
    "fed-decreases-interest-rates-by-50-bps-after-january-2026-meeting",
);
console.log(`${market.question}`);
console.log(`YES: ${market.tokens.find((t) => t.outcome === "Yes")?.price}`);
console.log(`NO: ${market.tokens.find((t) => t.outcome === "No")?.price}`);

// 获取处理后的订单簿（含分析数据）
const orderbook = await sdk.getOrderbook(market.conditionId);
console.log(`多头套利利润: ${orderbook.summary.longArbProfit}`);
console.log(`空头套利利润: ${orderbook.summary.shortArbProfit}`);

// 检测套利机会
const arb = await sdk.detectArbitrage(market.conditionId);
if (arb) {
    console.log(
        `${arb.type.toUpperCase()} 套利: ${
            (arb.profit * 100).toFixed(2)
        }% 利润`,
    );
    console.log(arb.action);
}
