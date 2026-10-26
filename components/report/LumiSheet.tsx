"use client";

import { useEffect, useRef, useState } from "react";
import { evidenceSeries } from "@/lib/story/series";
import { answerFor, type LumiTopic } from "@/lib/story/lumi";
import type { Finding, Story } from "@/lib/story/types";
import { EvidenceChart } from "./EvidenceChart";
import { Orb } from "./Orb";
import { Icon } from "./ui";
import s from "./LumiSheet.module.css";

/**
 * "Explain": a short Lumi conversation. The first answer is the one asked for; follow-ups come from the chips or the
 * keyboard. Answers are scripted from the person's own numbers, so nothing here is invented or medical.
 */
export function LumiSheet({
  first,
  topics,
  findings,
  story,
  start,
  end,
  area,
  onBack,
}: {
  first: LumiTopic;
  topics: LumiTopic[];
  findings: Finding[];
  story: Story;
  start: string;
  end: string;
  area: string;
  onBack: () => void;
}) {
  const [msgs, setMsgs] = useState<LumiTopic[]>([first]);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<Record<number, "up" | "down">>({});
  const last = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (msgs.length > 1) last.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [msgs.length]);
  useEffect(() => {
    if (typing) input.current?.focus();
  }, [typing]);

  const lead = findings.find((f) => f.id === first.findingId);
  const causes = lead?.causes.length ? lead.causes : [{ kind: "area" as const, name: area, when: "" }];
  const asked = new Set(msgs.map((m) => m.script.question));
  const chips = topics.filter((t) => !asked.has(t.script.question)).slice(0, 3);
  const ask = (t: LumiTopic) => setMsgs((m) => [...m, t]);
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <div className={s.chat}>
      <button
        type="button"
        className={s.orbs}
        aria-expanded={open}
        aria-label={open ? "Hide what Lumi looked at" : "Show what Lumi looked at"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <span className={s.orbsOpen} data-count={Math.min(2, causes.length)}>
            {causes.slice(0, 2).map((c, i) => (
              <span key={c.name} className={s.orbItem}>
                <Orb kind={c.kind} size={i === 0 ? "lg" : "md"} />
                <span className={s.orbName}>{c.name}</span>
                {c.when && <span className={s.orbWhen}>{c.when}</span>}
              </span>
            ))}
          </span>
        ) : (
          <span className={s.orbsClosed}>
            {causes.slice(0, 2).map((c) => (
              <Orb key={c.name} kind={c.kind} size="xs" />
            ))}
          </span>
        )}
      </button>
      <h2 className={s.title}>{first.script.title}</h2>
      <p className={s.sub}>{first.script.sub}</p>

      {msgs.map((m, i) => {
        const f = findings.find((x) => x.id === m.findingId);
        const data = f && f.metric ? evidenceSeries(story, f, start, end) : null;
        const text = m.script.paras.join(" ");
        return (
          <div key={i} className={s.turn} ref={i === msgs.length - 1 ? last : undefined}>
            <p className={s.bubble}>
              <span className="visually-hidden">You asked: </span>
              {m.script.question}
            </p>
            <div className={s.answer} aria-live={i > 0 ? "polite" : undefined}>
              <span className="visually-hidden">Lumi: </span>
              {m.script.paras.map((p, k) => (
                <p key={k} className={s.para}>
                  {p}
                </p>
              ))}
            </div>
            {data && data.points.length > 1 && (
              <div className={s.chart}>
                <EvidenceChart data={data} start={start} end={end} />
              </div>
            )}
            {m.script.stats.length > 0 && (
              <dl className={s.stats}>
                {m.script.stats.map((st) => (
                  <div key={st.l} className={s.stat}>
                    <dt className={s.statLabel}>{st.l}</dt>
                    <dd className={s.statValue}>{st.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className={s.tools}>
              <button type="button" aria-label="Copy answer" onClick={() => navigator.clipboard?.writeText(text).catch(() => {})}>
                <Icon name="content_copy" size={16} />
              </button>
              <button type="button" aria-label="Read answer aloud" onClick={() => speak(text)}>
                <Icon name="volume_up" size={16} />
              </button>
              <button type="button" aria-label="Helpful" aria-pressed={liked[i] === "up"} onClick={() => setLiked((l) => ({ ...l, [i]: "up" }))}>
                <Icon name="thumb_up" size={16} />
              </button>
              <button type="button" aria-label="Not helpful" aria-pressed={liked[i] === "down"} onClick={() => setLiked((l) => ({ ...l, [i]: "down" }))}>
                <Icon name="thumb_down" size={16} />
              </button>
            </div>
          </div>
        );
      })}

      {chips.length > 0 && (
        <div className={s.more}>
          <p className={s.moreLabel}>Ask Lumi about</p>
          <div className={s.chips}>
            {chips.map((c) => (
              <button key={c.script.question} type="button" className={s.chip} onClick={() => ask(c)}>
                <Icon name="flare" size={16} />
                {c.script.question}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={s.note}>Lumi explains patterns in your own scans. It can’t diagnose skin conditions.</p>

      <div className={s.composer}>
        <span className={s.fade} aria-hidden />
        {typing ? (
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              ask(answerFor(draft, topics, area));
              setDraft("");
            }}
          >
            <label className="visually-hidden" htmlFor="lumi-q">
              Ask Lumi a question
            </label>
            <input
              id="lumi-q"
              ref={input}
              className={s.input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Ask about your ${area.toLowerCase()}…`}
              autoComplete="off"
            />
            <button type="submit" className={s.send} aria-label="Send">
              <Icon name="arrow_upward" size={20} />
            </button>
          </form>
        ) : (
          <div className={s.bar}>
            <button type="button" className={s.round} aria-label="Back to report" onClick={onBack}>
              <Icon name="chevron_left" />
            </button>
            <span className={s.talk} aria-hidden>
              <Icon name="graphic_eq" size={26} />
            </span>
            <span className={s.right}>
              <button type="button" className={s.plain} aria-label="Type a question" onClick={() => setTyping(true)}>
                <Icon name="keyboard" size={24} />
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
