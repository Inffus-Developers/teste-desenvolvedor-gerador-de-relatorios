import { describe, expect, it } from "vitest";
import { date, money } from "./format";
import { query } from "./api";

describe("Apresentação e filtros", () => {
  it("formata valores brasileiros sem alterar a precisão do backend", () => {
    expect(money("1020.50").replace(/\s/g, " ")).toBe("R$ 1.020,50");
  });
  it("preserva centavos de totalizadores acima do limite seguro de inteiros JS", () => {
    expect(money("99999999999999999.99")).toBe("R$ 99.999.999.999.999.999,99");
  });
  it("preserva a data civil sem deslocar o dia por fuso horário", () => {
    expect(date("2026-09-01")).toBe("01/09/2026");
    expect(date(null)).toBe("—");
  });
  it("preserva filtros e codifica o cursor sem enviar campos vazios", () => {
    const result = new URLSearchParams(
      query({ status: "paid", customer_id: "", cursor: "a+b/=", per_page: 15 }),
    );
    expect(result.has("customer_id")).toBe(false);
    expect(result.get("cursor")).toBe("a+b/=");
    expect(result.get("status")).toBe("paid");
  });
});
