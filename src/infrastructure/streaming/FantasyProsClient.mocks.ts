// Test fixtures/mocks for FantasyProsClient.
//
// PAGE_HTML is a hand-trimmed but structurally faithful copy of the real
// streaming-pitchers.php page (fetched 2026-06-10): one
// table--sticky-columns table per day, a date-subhead <h2> as the first row,
// a 15-column header row, and player rows whose player-label cell is
// GENUINELY MALFORMED on the live site (`...report-page"<td>` — unclosed
// attribute followed by a nested <td>). The fixture preserves that
// malformation on the Ohtani row.

export const PAGE_HTML = `
<div class="mobile-table mobile-table-report-page"><div class="game-tables">
<table class="table table--sticky-columns table-condensed"><caption class="hidden-aria">Streaming Pitcher Rankings for Tuesday, June 16th</caption><tbody>
<tr><th colspan="15" class="date-subhead primary-heading-subheading"><h2 style="margin:0;">Wednesday, June 10th</h2></th></tr>
<tr><th class="sched-subhead"><a class="tooltip-top" data-tooltip="Value Based Rank">VBR</a></th><th class="sched-subhead player-label player-label-report-page">Pitcher</th><th class="sched-subhead">Team</th><th class="sched-subhead">Throws</th><th class="sched-subhead">% Rost</th><th class="sched-subhead">IP</th><th class="sched-subhead">K</th><th class="sched-subhead">BB</th><th class="sched-subhead">W</th><th class="sched-subhead">L</th><th class="sched-subhead">ERA</th><th class="sched-subhead">WHIP</th><th class="sched-subhead">Opp.</th><th class="sched-subhead">wOBA</th><th class="sched-subhead">Opp. SP</th></tr>
<tr class="mpb-player-7354">
<td>1</td>
<td class="player-label player-label-report-page"<td><a href="/mlb/players/shohei-ohtani.php" class="fp-player-link fp-id-7354" fp-player-name="Shohei Ohtani">Shohei Ohtani</a></td>
<td>LAD</td><td>R</td><td class="own consensus_own" >50%</td><td class="own yahoo_own" >0%</td><td class="own espn_own" >100%</td><td>61.0</td><td>67</td><td>18</td><td>6</td><td>2</td><td>0.74</td><td>0.79</td>
<td data-woba="0.3231" class="matchup">@PIT</td><td data-woba="0.3231" class="matchup">0.3231</td><td>J. Jones</td></tr>
<tr class="mpb-player-9999">
<td>2</td>
<td class="player-label player-label-report-page"<td><a href="/mlb/players/logan-ohoppe-sr.php" class="fp-player-link fp-id-9999" fp-player-name="Logan O&#8217;Hoppe Sr.">Logan O&#8217;Hoppe Sr.</a></td>
<td>TBR</td><td>R</td><td class="own consensus_own" >12%</td><td class="own yahoo_own" >8%</td><td class="own espn_own" >15%</td><td>40.0</td><td>38</td><td>12</td><td>3</td><td>1</td><td>3.20</td><td>1.10</td>
<td data-woba="0.3100" class="matchup">BOS</td><td data-woba="0.3100" class="matchup">0.3100</td><td>W. Buehler</td></tr>
</tbody></table>
<table class="table table--sticky-columns table-condensed"><caption class="hidden-aria">Streaming Pitcher Rankings for Tuesday, June 16th</caption><tbody>
<tr><th colspan="15" class="date-subhead primary-heading-subheading"><h2 style="margin:0;">Thursday, June 11th</h2></th></tr>
<tr><th class="sched-subhead">VBR</th><th class="sched-subhead player-label">Pitcher</th><th class="sched-subhead">Team</th></tr>
<tr class="mpb-player-1111">
<td>1</td>
<td class="player-label player-label-report-page"<td><a href="/mlb/players/edward-cabrera-p.php" class="fp-player-link fp-id-1111" fp-player-name="Edward Cabrera">Edward Cabrera</a></td>
<td>MIA</td><td>R</td><td class="own consensus_own" >40%</td><td class="own yahoo_own" >35%</td><td class="own espn_own" >45%</td><td>70.0</td><td>80</td><td>30</td><td>5</td><td>3</td><td>3.50</td><td>1.20</td>
<td data-woba="0.3300" class="matchup">@COL</td><td data-woba="0.3300" class="matchup">0.3300</td><td>G. Marquez</td></tr>
</tbody></table>
<table class="table table--sticky-columns table-condensed"><caption class="hidden-aria">Streaming Pitcher Rankings for Tuesday, June 16th</caption><tbody>
<tr><th colspan="15" class="date-subhead primary-heading-subheading"><h2 style="margin:0;">Friday, June 12th</h2></th></tr>
<tr><th class="sched-subhead">VBR</th><th class="sched-subhead player-label">Pitcher</th><th class="sched-subhead">Team</th></tr>
</tbody></table>
</div></div>
`;

export function htmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export function errorResponse(status: number): Response {
  return new Response("Access denied", { status });
}
