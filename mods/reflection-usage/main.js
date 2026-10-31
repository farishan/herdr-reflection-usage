import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, theme } from "herdr";

export default class ReflectionUsage extends View {
  init(_props, cx) {
    this.data = null;
    this.error = null;
    cx.spawn(async (cx) => {
      for (;;) {
        await this.refresh(cx);
        cx.notify();
        await cx.sleep(60000);
      }
    });
  }

  async refresh(cx) {
    try {
      const r = await exec("reflection-usage", []);
      if (r.code === 0) {
        this.data = JSON.parse(r.stdout.trim());
        this.error = null;
      } else {
        this.error = (r.stderr || `exit ${r.code}`).slice(0, 240);
      }
    } catch (e) {
      this.error = String(e).slice(0, 240);
    }
  }

  fmt(n) {
    if (n == null) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(Math.round(n));
  }

  secs(s) {
    if (s == null) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h${m ? m + "m" : ""}` : `${m}m`;
  }

  pct(remaining, limit) {
    if (remaining == null || !limit) return "—";
    return Math.round((remaining / limit) * 100) + "%";
  }

  // Color by USED ratio: green (low use) -> yellow -> red (near limit).
  barColor(usedRatio) {
    if (usedRatio == null) return "#484f58";
    if (usedRatio >= 0.8) return "#f85149";
    if (usedRatio >= 0.5) return "#d29922";
    return "#3fb950";
  }

  dayRow(label, remaining, limit, reset) {
    const t = theme();
    const used = (remaining != null && limit != null) ? Math.max(0, limit - remaining) : null;
    const usedRatio = (used != null && limit) ? used / limit : null;
    const usedPct = usedRatio == null ? "—" : Math.round(usedRatio * 100) + "%";
    const fill = usedRatio == null ? "0%" : `${Math.max(2, Math.round(usedRatio * 100))}%`;
    return v_flex()
      .gap(2)
      .child(
        h_flex()
          .items_center()
          .child(div().w(74).text_color(t.muted).child(label))
          .child(div().flex_1().child(`${this.fmt(used)} used · ${this.fmt(remaining)} left`))
          .child(div().w(34).text_color(t.dim).child(usedPct))
          .child(div().w(40).text_color(t.dim).child(this.secs(reset)))
      )
      .child(
        h_flex()
          .h(3)
          .w_full()
          .rounded(2)
          .bg("#21262d")
          .child(div().h(3).rounded(2).bg(this.barColor(usedRatio)).w(fill))
      );
  }

  render() {
    const t = theme();
    const d = this.data;
    const checked = d && d.last_checked ? new Date(d.last_checked).toLocaleTimeString() : null;
    return v_flex()
      .size_full()
      .px(10)
      .py(8)
      .gap(4)
      .bg(t.background)
      .text_size(11)
      .child(
        h_flex()
          .items_center()
          .child(div().text_size(12).child("Reflection"))
          .child(div().flex_1())
          .child(div().text_color(t.dim).child(checked ? checked : "…"))
      )
      .when(Boolean(this.error), (el) =>
        el.child(div().text_color(t.blocked || t.error).child(this.error))
      )
      .when(Boolean(d), (el) =>
        el
          .child(this.dayRow("Requests", d.requests_remaining_day, d.requests_limit_day, d.requests_reset_day_seconds))
          .child(this.dayRow("Tokens", d.tokens_remaining_day, d.tokens_limit_day, d.tokens_reset_day_seconds))
          .child(this.dayRow("Output", d.output_tokens_remaining, d.output_tokens_limit, d.output_tokens_reset_seconds))
          .child(this.dayRow("Uncached", d.uncached_input_tokens_remaining, d.uncached_input_tokens_limit, d.uncached_input_tokens_reset_seconds))
          .child(div().h(1).bg("#21262d").my(2))
          .child(
            h_flex()
              .gap(10)
              .text_color(t.dim)
              .child(div().child(`min req ${this.fmt(Math.max(0, d.requests_limit - d.requests_remaining))}/${this.fmt(d.requests_limit)} used`))
              .child(div().child(`tok ${this.fmt(Math.max(0, d.tokens_limit - d.tokens_remaining))}/${this.fmt(d.tokens_limit)} used`))
          )
      );
  }
}