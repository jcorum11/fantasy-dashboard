// Test fixtures/mocks for PitcherListClient.
//
// ARTICLE_HTML is a hand-trimmed but structurally faithful copy of a real
// "Starting Pitcher Streamer Ranks" post (2026-06-10, WP post 303812):
// 24pt day-header spans, 20pt tier-header spans, <p><strong> pick paragraphs
// with player-tag anchors, the singular-name legend at the top (no font-size),
// pre-day "My Pick" paragraphs, a DataTable between days, and a gated
// (pick-less) third day.

export const ARTICLE_POST_DATE = "2026-06-10T12:50:05";

export const ARTICLE_HTML = `
<p><strong><span style="color: #008000;">Auto-Start</span> &#8211; </strong>Just do it. Don&#8217;t overthink this, start the man.</p>
<p><strong><span style="color: #b847f5;">Probably Start </span>&#8211; </strong>I&#8217;m likely starting these arms.</p>
<p><strong><span style="color: #ff9900;">Questionable Start</span> &#8211; </strong>Think of this tier as risky.</p>
<p><strong><span style="color: #ff0000;">Do Not Start</span> &#8211; </strong>The reward is not worth the risk.</p>
<p>My Pick today: <a class="player-tag" href="https://pitcherlist.com/player/ignore-me/">Ignore Me</a> @ AAA &#8211; pre-day content must not parse as a pick.</p>
<p style="text-align: center;"><span style="font-size: 24pt; color: #333399;" data-darkreader-inline-color=""><strong>Wednesday 6/10 Starting Pitcher Streamer Rankings</strong></span></p>
<p><span style="color: #3366ff; font-size: 20pt;" data-darkreader-inline-color=""><strong>Auto-Starts</strong></span></p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/shohei-ohtani/">Shohei Ohtani</a> @ PIT &#8211; </strong>Aces gonna ace.</p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/drew-rasmussen/">Drew Rasmussen</a> vs. BOS &#8211; </strong>Rolling.</p>
<p><span style="color: #3366ff; font-size: 20pt;" data-darkreader-inline-color=""><strong>Probably Starts</strong></span></p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/carlos-rodon/">Carlos Rodón</a> @ CLE &#8211; </strong>Lefty heat.</p>
<p><span style="color: #3366ff; font-size: 20pt;" data-darkreader-inline-color=""><strong>Questionable Starts</strong></span></p>
<p><strong>Twins Bullpen (Opener)@ DET &#8211; </strong>We may see <a class="player-tag" href="https://pitcherlist.com/player/mike-someone/">Mike Someone</a> in bulk.</p>
<p><span style="color: #3366ff; font-size: 20pt;" data-darkreader-inline-color=""><strong>Do Not Starts</strong></span></p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/ryan-feltner/">Ryan Feltner</a> vs. CHC &#8211; </strong>Coors. No.</p>
<div class="table"><div class="table-branding"><div class="title">Wednesday 6/10 Starting Pitcher Streamer Rankings</div></div>
<table id="DataTables_Table_0" class="dataTableLaunch"><thead><tr><th><span class="dt-column-title">Rank</span></th><th><span class="dt-column-title">Pitcher</span></th></tr></thead>
<tbody><tr><td>1</td><td>Table Pitcher Must Not Parse</td></tr></tbody></table></div>
<p style="text-align: center;"><span style="font-size: 24pt; color: #333399;" data-darkreader-inline-color=""><strong>Thursday 6/11 Starting Pitcher Streamer Rankings</strong></span></p>
<p><span style="color: #3366ff; font-size: 20pt;" data-darkreader-inline-color=""><strong>Auto-Starts</strong></span></p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/bryan-woo/">Bryan Woo</a> @ BAL &#8211; </strong>Woo!</p>
<p><strong><a class="player-tag" href="https://pitcherlist.com/player/patrick-obrien/">Patrick O&#8217;Brien</a> vs. SDP &#8211; </strong>Entity in the name.</p>
<p style="text-align: center;"><span style="font-size: 24pt; color: #333399;" data-darkreader-inline-color=""><strong>Friday 6/12 Starting Pitcher Streamer Rankings</strong></span></p>
<div class="pl-gate "><span class="pl-gate--text">Friday rankings:</span><div class="mepr_error"><p><a href="https://pitcherlist.com/premium">PL Pro</a></p></div></div>
`;

export function makeWpPost(
  overrides: Partial<{ id: number; date: string; content: string }> = {}
) {
  return {
    id: overrides.id ?? 303812,
    date: overrides.date ?? ARTICLE_POST_DATE,
    slug: "starting-pitcher-streamer-ranks-fantasy-baseball-6-10-6-11-6-12",
    title: {
      rendered:
        "Starting Pitcher Streamer Ranks Fantasy Baseball: 6/10 &#038; 6/11 &#038; 6/12",
    },
    content: { rendered: overrides.content ?? ARTICLE_HTML, protected: false },
  };
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(status: number): Response {
  return new Response("nope", { status });
}
