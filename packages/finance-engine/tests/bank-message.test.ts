import { describe, expect, it } from "vitest";
import { parseBankMessage } from "../src/bank-message";

// Fixtures mirror real alert formats (Meezan, myABL, NayaPay) with names/amounts changed.
const aliases = ["A.SALMAN", "ADIL SALMAN BUTT", "AADIL SALMAN BUTT"];
const parse = (text: string) => parseBankMessage(text, { ownerAliases: aliases });

describe("parseBankMessage", () => {
  it("logs a Meezan transfer to someone else as an expense", () => {
    const r = parse(
      "Dear Customer, PKR 4,250.00 sent from your account xxx1111 with the following details: Beneficiary Account: : K RAZA JAZZ-xxxCASH Branch : SOME BR LHR Transaction Date : 19-Sep-2026 Transaction Time : 10:39 Fee: Fee: Rs.4.00",
    );
    expect(r).toMatchObject({ status: "transaction", type: "EXPENSE", amount: 4250, currency: "PKR", description: "Transfer to K Raza" });
  });

  it("skips a Meezan transfer to your own account", () => {
    const r = parse(
      "Debit Transaction Alert Dear Customer, PKR 1300.00 sent from your account xxx1111 with the following details: Beneficiary Account Title: : A.SALMAN Branch : SOME BR LHR",
    );
    expect(r).toEqual({ status: "ignored", reason: "transfer between your own accounts" });
  });

  it("reads the beneficiary name (not the masked account) from a myABL transfer", () => {
    const r = parse(
      "myABL Fund Transfer Alert | Dear AADIL SALMAN BUTT, PKR 7,500.00 have been sent from your Account No: ***0000 on Friday , 25-Sep-2026 at 01:51 PM through myABL. Transaction details are as follow: | | Transaction Description : | RAAST Transfer | | Beneficiary Name : | ZAIN ALI | | Beneficiary Account : | ***1234 | | Fee/Tax Charged : | Rs. 0.00 |",
    );
    expect(r).toMatchObject({ status: "transaction", type: "EXPENSE", amount: 7500, description: "Transfer to Zain Ali" });
  });

  it("skips money received from yourself on myABL", () => {
    const r = parse(
      "Dear AADIL SALMAN BUTT, PKR 7,500.00 has been received in your Account No: ***0000 on Friday. Transaction details are as follow: Transaction Description : RAAST Transfer Sender Name : ADIL SALMAN BUTT Sender Account : ***1111",
    );
    expect(r).toEqual({ status: "ignored", reason: "transfer between your own accounts" });
  });

  it("logs a NayaPay card spend by merchant with the total amount", () => {
    const r = parse(
      "You spent Rs. 5,932.58 at ACME* SOFTWARE SUB +14155550100 US 💳\nYour online transaction was successful ACME* SOFTWARE SUB +14155550100 US Online Transaction - Rs. 5,932.58 Transaction Amount USD 20",
    );
    expect(r).toMatchObject({ status: "transaction", type: "EXPENSE", amount: 5933, currency: "PKR", description: "Acme* Software Sub" });
  });

  it("logs money received from another person as income", () => {
    const r = parse("You got Rs. 300 from Sara Khan 🎉\nCha-Ching! Sara Khan Allied Bank-0011 Amount Received Rs. 300");
    expect(r).toMatchObject({ status: "transaction", type: "INCOME", amount: 300, category: "INCOME", description: "From Sara Khan" });
  });

  it("categorises mobile bundles as utilities", () => {
    const r = parse("You subscribed to a mobile bundle of Rs. 1,300 📱\nYour Mobile Top-Up was successful Jazz Mobile Top-Up - Rs. 1300");
    expect(r).toMatchObject({ status: "transaction", type: "EXPENSE", amount: 1300, category: "UTILITIES", description: "Mobile top-up" });
  });

  it("treats a reversed top-up as a refund", () => {
    const r = parse(
      "Mobile Top-Up reversed\nMobile Top-Up failed, amount reversed! Hi! Your Mobile Top-Up of Rs. 1300 sent to Jazz-03000000000 was unsuccessful, but we've reversed the amount to your wallet.",
    );
    expect(r).toMatchObject({ status: "transaction", type: "INCOME", amount: 1300, description: "Refund: Mobile top-up" });
  });

  it("logs a wallet service charge as a bank fee", () => {
    const r = parse("In-App Biometric Verification Unlock Account - Rs. 99 AMOUNT DETAILS Service Charges Rs. 86.09 Taxes Rs. 12.91 Total Amount Rs. 99");
    expect(r).toMatchObject({ status: "transaction", type: "EXPENSE", amount: 99, description: "Bank fee" });
  });

  it("ignores login alerts, OTPs and declined payments", () => {
    expect(parse("Dear Customer, You have successfully logged on to Meezan bank Mobile App at 27/09/2026 02:36 PM.")).toMatchObject({ status: "ignored" });
    expect(parse("Your OTP for a purchase of PKR 2,000 at DARAZ is 482913. Do not share it.")).toEqual({ status: "ignored", reason: "one-time code" });
    expect(parse("Your card payment of Rs. 500 at KFC was declined.")).toEqual({ status: "ignored", reason: "failed or declined transaction" });
  });

  it("handles generic SMS phrasing", () => {
    expect(parse("PKR 1,250 spent at FOODPANDA via Debit Card ending 1234 on 27-Sep.")).toMatchObject({
      status: "transaction",
      type: "EXPENSE",
      amount: 1250,
      description: "Foodpanda",
    });
    expect(parse("Rs.20000 credited to your a/c from Acme Payroll")).toMatchObject({ status: "transaction", type: "INCOME", amount: 20000 });
  });
});
