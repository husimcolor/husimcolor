import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ZH_CN_PERSONAL_PILOT_REPORT } from "../shared/zh-cn-personal-pilot";
import { createZhCnPilotPersonalPdfBuffer } from "../server/zh-cn-pilot-pdf-report";

describe("zh-CN personal pilot report", () => {
  it("uses the approved terms and keeps all personal-report sections", () => {
    const serialized = JSON.stringify(ZH_CN_PERSONAL_PILOT_REPORT);
    expect(serialized).toContain("主要心理特征");
    expect(serialized).toContain("辅助心理特征");
    expect(serialized).toContain("调和色");
    expect(ZH_CN_PERSONAL_PILOT_REPORT.stage1.colors).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.cards).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.combinedCoaching).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.lifeRole.directions).toHaveLength(3);
    expect(serialized).toContain("潜意识");
    expect(serialized).toContain("逐步找回对日常生活的掌控感");
    expect(serialized).toContain("把要做的事情列下来，一件件完成");
    expect(serialized).toContain("充分听取对方的想法后，再作判断");
    expect(serialized).toContain("你往往能较快理清事情的轻重缓急");
    expect(serialized).toContain("认真对待事情，也看重彼此之间的信任");
    expect(serialized).toContain("一起找到双方都能接受的方向");
    expect(serialized).toContain("用自己认可的方式继续往下做");
    expect(serialized).toContain("第3张卡 · 下一步方向");
    expect(serialized).toContain("恢复方向");
    expect(serialized).toContain("想等了解得更充分后再行动，因此容易迟迟没有开始。");
    expect(serialized).toContain("报告示例");
    expect(ZH_CN_PERSONAL_PILOT_REPORT.lifeRole.title).toBe("信息梳理与判断型");
    expect(ZH_CN_PERSONAL_PILOT_REPORT.recoveryRoutine.message).toBe("敏感不需要被否定；它也提醒你正在察觉更多细微的变化。");
    expect(serialized).not.toContain("潜在心理倾向");
    expect(serialized).not.toContain("生命角色能量");
    expect(serialized).not.toContain("策略解读者型");
    expect(serialized).not.toContain("列出待办、逐项完成");
    expect(serialized).not.toContain("面对要处理的事，你可能更倾向于先确认方向，再了解相关信息，作出判断");
    expect(serialized).not.toContain("你能较快厘清工作的轻重缓急");
    expect(serialized).not.toContain("认真投入和深入信任");
    expect(serialized).not.toContain("清楚交换彼此的想法");
    expect(serialized).not.toContain("你擅长");
    expect(serialized).not.toContain("用自己认可的方式往前推进");
    expect(serialized).not.toContain("第3张卡 · 调整方向");
    expect(serialized).not.toContain("一起把方向协调好");
    expect(serialized).not.toContain("想先了解得更充分再行动，开始的时点容易往后拖");
    const rendererSource = readFileSync(path.join(process.cwd(), "server", "zh-cn-pilot-pdf-report.ts"), "utf8");
    expect(rendererSource).toContain("值得关注的成长方向");
    expect(rendererSource).toContain("当下的内心变化");
    expect(rendererSource).toContain("我的社会角色与优势");
    expect(rendererSource).toContain("需要留意的一面");
    expect(rendererSource).toContain("今天给自己的话");
    expect(rendererSource).toContain("今天的调整小练习");
    expect(rendererSource).toContain("三张卡所呈现的心理变化");
    expect(rendererSource).toContain("这些颜色可作为日常自我调节的参考，帮助你放松身心、找回平衡，而不是要求你改变自己。");
    expect(rendererSource).not.toContain("今天的专属恢复小练习");
  });

  it("renders a non-empty simplified Chinese PDF from fixed virtual data", async () => {
    const pdf = await createZhCnPilotPersonalPdfBuffer();
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 30_000);

  it("keeps the three review screens static and separate from customer flows", () => {
    const pages = ["zh-cn-pilot.html", "zh-cn-pilot-colors.html", "zh-cn-pilot-cards.html", "zh-cn-pilot-recovery.html"];
    for (const page of pages) {
      const source = readFileSync(path.join(process.cwd(), "public", page), "utf8");
      expect(source).toContain("固定虚拟数据");
      expect(source).toContain("/api/zh-cn-pilot-personal-pdf");
      expect(source).toContain("报告示例");
      expect(source).not.toMatch(/trpc|localStorage|AsyncStorage|fetch\s*\(|XMLHttpRequest/i);
      expect(source).not.toContain("公开审核样本");
    }
    const overview = readFileSync(path.join(process.cwd(), "public", "zh-cn-pilot.html"), "utf8");
    const cards = readFileSync(path.join(process.cwd(), "public", "zh-cn-pilot-cards.html"), "utf8");
    expect(overview).toContain("充分听取对方的想法后，再作判断");
    expect(overview).toContain("一起找到双方都能接受的方向");
    expect(cards).toContain("三张卡所呈现的心理变化");
    expect(cards).toContain("第1张卡 · 潜意识");
    expect(cards).toContain("第3张卡 · 下一步方向");
  });
});
