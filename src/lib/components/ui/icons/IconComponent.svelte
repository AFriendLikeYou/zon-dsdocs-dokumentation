<script lang="ts">
  import { copySVGToClipboard, downloadIcon } from "$lib/utils";
  import { CopyButton } from "$components/ui/copy-button";
  import { DownloadButton } from "$components/ui/download-button";
  import type { Icon } from "$types/global";

  let { icon }: { icon: Icon } = $props();
</script>

<!-- Bewusst OHNE Enter/Exit-Transition: Such-Filtern ist hochfrequent — Blur auf
     bis zu 65 Icons pro Tastenanschlag machte die Suche träge (Frequenz-Regel). -->
<div class="zon-icon__container">
  <!-- <div class="bg-grid"></div> -->
  <!-- Klick aufs Icon kopiert den Icon-NAMEN (inline-Feedback über CopyButton). -->
  <CopyButton
    value={icon.name}
    ariaLabel={`Icon-Namen „${icon.name}" kopieren`}
    class="zon-icon__copy-name"
  >
    <span class="zon__icon">
      {@html icon.svg}
      <span>{icon.name}</span>
    </span>
    <span class="zon-icon__copied" aria-hidden="true">Name kopiert ✓</span>
  </CopyButton>

  <div class="zon-icon__actions">
    <DownloadButton
      onDownload={() => downloadIcon(icon)}
      ariaLabel={`Download ${icon.name} icon`}
      feedback="toast"
      toastMessage={`Das Icon "${icon.name}" wurde heruntergeladen.`}
      iconButton
    />
    <CopyButton
      onCopy={() => copySVGToClipboard(icon)}
      ariaLabel={`${icon.name} in der Zwischenablage kopieren`}
      feedback="toast"
      toastMessage={`Das Icon "${icon.name}" wurde in die Zwischenablage kopiert.`}
      iconButton
    />
  </div>
</div>

<style>
  .zon-icon__container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--z-ds-space-16);
    padding: var(--z-ds-space-24);
    border-radius: var(--ds-radius);
    border: 0px solid var(--ds-border);
    background-color: var(--ds-surface-raised);

    .zon__icon {
      display: flex;
      text-align: center;
      align-items: center;
      flex-direction: column;
      gap: var(--z-ds-space-8);

      span {
        font-size: var(--ds-text-xs);
        opacity: 0.7;
        text-wrap: nowrap;
      }
    }

    :global(.zon__icon svg) {
      width: 24px;
      height: auto;
    }

    /* Der ganze Icon-Bereich ist ein Copy-Button (Icon-Name). */
    :global(.zon-icon__copy-name) {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--z-ds-space-8);
      width: 100%;
      padding: var(--z-ds-space-8);
      border-radius: var(--ds-radius-sm);
      color: var(--ds-text);
      transition:
        background-color var(--ds-dur) var(--ds-ease),
        transform var(--ds-dur) var(--ds-ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      :global(.zon-icon__copy-name:hover) {
        background: var(--ds-surface);
      }
    }
    /* Bestätigungs-Overlay: erscheint auf .is-copied (CopyButton setzt die Klasse). */
    .zon-icon__copied {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ds-radius-sm);
      background: var(--ds-surface-raised);
      color: var(--ds-text);
      font-size: var(--ds-text-xs);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--ds-dur) var(--ds-ease-out);
    }
    :global(.zon-icon__copy-name.is-copied .zon-icon__copied) {
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      :global(.zon-icon__copy-name),
      .zon-icon__copied {
        transition: none;
      }
    }

    .zon-icon__actions {
      display: flex;
      gap: var(--z-ds-space-8);
    }
  }
</style>
