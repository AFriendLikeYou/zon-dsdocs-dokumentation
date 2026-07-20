# Herkunft der figma-\*-Skills

Kuratiertes Subset (6 von 22) aus **southleft/figma-console-mcp-skills**
(github.com/southleft/figma-console-mcp-skills, MIT — siehe FIGMA-SKILLS-LICENSE),
Stand Commit `fbad1e2`, installiert 2026-07-07.

Alle sechs laufen mit dem **offiziellen Figma-MCP** (kein figma-console-Server nötig):

- figma-analyze-component-set — Varianten-State-Machine + diffFromDefault (ergänzt tooling/zeit-de-exporter/figma-measure.js)
- figma-deep-component — tiefer Komponenten-Baum mit aufgelösten Tokens
- figma-check-design-parity — Parity-Score Doku/Code ↔ Figma (Audit-Punkt „Validierung")
- figma-version-history / figma-blame-node — Versions-Drift via REST (braucht FIGMA_TOKEN als Env-Var, NIE committen)
- figma-comments — Befunde als Kommentare zurück nach Figma pinnen (REST, FIGMA_TOKEN)

Bewusst NICHT übernommen: Token-Export/-Import/-Setup (ADR-013: Upstream-Sache des
npm-Pakets), figma-generate-component-doc (eigene kanonische Pipeline — keine zweite
Doku-Wahrheit; seine Ideen sind in figma-measure.js/IMPORT.md eingeflossen), FigJam/Slides.
