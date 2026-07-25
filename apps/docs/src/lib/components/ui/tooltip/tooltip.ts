/**
 * tooltip — Svelte-Action, die an ein beliebiges Element eine barrierefreie
 * Kurzinfo hängt. Ersetzt native `title=`-Attribute in der Editor-/App-UI
 * (Provenance-Pills, Badges, Icon-Buttons), die als reines <div title> nicht
 * tastatur-erreichbar sind und deren Optik der Browser nicht steuert.
 *
 * Nutzung:
 *   <span use:tooltip={'Wird vom Import gepflegt'}>…</span>
 *   <button use:tooltip={{ text: 'Nach oben', position: 'bottom' }}>…</button>
 *
 * Verhalten:
 *   · erscheint bei Hover UND bei Tastatur-Fokus (:focus-visible), ~400ms Verzögerung
 *     bei Hover, sofort bei Fokus.
 *   · Emil-Fade <200ms mit starkem ease-out; `prefers-reduced-motion` schaltet ihn ab.
 *   · a11y: role=tooltip + aria-describedby-Verknüpfung zum Anker.
 *   · Esc schließt; Scrollen/Resize schließt (Position würde sonst driften).
 *   · Touch (pointer: coarse) zeigt keinen Tooltip — er würde die Bedienung blockieren;
 *     der sichtbare Inhalt/aria-label trägt dort die Bedeutung.
 *
 * Ein einziger, wiederverwendeter Tooltip-Knoten hängt am <body>; die zugehörigen
 * Styles werden genau einmal injiziert (Action-Elemente außerhalb des Component-
 * Scopes können keine scoped-Styles nutzen).
 */

export type TooltipOptions = string | { text: string; position?: 'top' | 'bottom' };

const STYLE_ID = 'ds-tooltip-styles';
const DELAY_MS = 400;

let tipEl: HTMLDivElement | null = null;
let idCounter = 0;

function ensureStyles() {
	if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
		.ds-tooltip {
			position: fixed;
			z-index: 60;
			max-width: 240px;
			padding: var(--z-ds-space-6, 6px) var(--z-ds-space-8, 8px);
			border-radius: var(--ds-radius-sm, 6px);
			background: var(--ds-text, #111);
			color: var(--ds-surface, #fff);
			font-size: var(--ds-text-xs, 0.75rem);
			line-height: 1.35;
			pointer-events: none;
			opacity: 0;
			transform: translateY(2px);
			transition:
				opacity 180ms var(--ds-ease-out, cubic-bezier(0.16, 1, 0.3, 1)),
				transform 180ms var(--ds-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
			/* Die Sprechblase ist eine INVERSE Fläche (--ds-text als Hintergrund) und
			   steht im Dark-Mode als helle Fläche auf dunkler Seite — dort braucht sie
			   keinen Schatten (der rohe schwarze trug 1,01 : 1). Light behält ihn. */
			box-shadow: var(--ds-elevation-shadow-raised, 0 4px 12px rgb(0 0 0 / 0.2));
		}
		.ds-tooltip[data-show='true'] {
			opacity: 1;
			transform: translateY(0);
		}
		@media (prefers-reduced-motion: reduce) {
			.ds-tooltip {
				transition: none;
			}
		}
	`;
	document.head.appendChild(style);
}

function getTipEl(): HTMLDivElement {
	if (!tipEl) {
		ensureStyles();
		tipEl = document.createElement('div');
		tipEl.className = 'ds-tooltip';
		tipEl.setAttribute('role', 'tooltip');
		tipEl.setAttribute('data-show', 'false');
		document.body.appendChild(tipEl);
	}
	return tipEl;
}

function normalize(opts: TooltipOptions): { text: string; position: 'top' | 'bottom' } {
	if (typeof opts === 'string') return { text: opts, position: 'top' };
	return { text: opts.text, position: opts.position ?? 'top' };
}

export function tooltip(node: HTMLElement, opts: TooltipOptions) {
	let current = normalize(opts);
	const tipId = `ds-tooltip-${++idCounter}`;
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let open = false;

	// Touch-Geräte: kein Tooltip (blockiert sonst die Bedienung).
	const isCoarse =
		typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

	function position() {
		const el = getTipEl();
		const r = node.getBoundingClientRect();
		const tr = el.getBoundingClientRect();
		const gap = 8;
		let left = r.left + r.width / 2 - tr.width / 2;
		left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
		const top = current.position === 'bottom' ? r.bottom + gap : r.top - tr.height - gap;
		el.style.left = `${Math.round(left)}px`;
		el.style.top = `${Math.round(top)}px`;
	}

	function show() {
		if (isCoarse || !current.text) return;
		const el = getTipEl();
		el.textContent = current.text;
		el.id = tipId;
		node.setAttribute('aria-describedby', tipId);
		// erst positionieren (Größe steht), dann im nächsten Frame einblenden —
		// so läuft der Fade sauber vom Endstandort aus.
		el.setAttribute('data-show', 'false');
		position();
		requestAnimationFrame(() => {
			position();
			el.setAttribute('data-show', 'true');
		});
		open = true;
	}

	function hide() {
		clearTimeout(showTimer);
		if (!open) return;
		open = false;
		node.removeAttribute('aria-describedby');
		if (tipEl && tipEl.id === tipId) {
			tipEl.setAttribute('data-show', 'false');
			tipEl.removeAttribute('id');
		}
	}

	function onEnter() {
		clearTimeout(showTimer);
		showTimer = setTimeout(show, DELAY_MS);
	}
	function onFocus() {
		// nur Tastatur-Fokus (nicht der Klick-Fokus, der ohnehin Hover hätte).
		// :focus-visible ist nicht überall selektierbar (ältere Engines/jsdom) →
		// im Zweifel zeigen (tastatur-sichere Vorgabe).
		let keyboard = true;
		try {
			keyboard = node.matches(':focus-visible');
		} catch {
			keyboard = true;
		}
		if (keyboard) show();
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') hide();
	}

	node.addEventListener('mouseenter', onEnter);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focusin', onFocus);
	node.addEventListener('focusout', hide);
	node.addEventListener('keydown', onKeydown);
	window.addEventListener('scroll', hide, true);
	window.addEventListener('resize', hide);

	return {
		update(next: TooltipOptions) {
			current = normalize(next);
			if (open) {
				getTipEl().textContent = current.text;
				position();
			}
		},
		destroy() {
			hide();
			node.removeEventListener('mouseenter', onEnter);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focusin', onFocus);
			node.removeEventListener('focusout', hide);
			node.removeEventListener('keydown', onKeydown);
			window.removeEventListener('scroll', hide, true);
			window.removeEventListener('resize', hide);
		}
	};
}
