// Server-seitiger Zugang zum geteilten content.json-Validierungs-Kern (tooling).
// Der Spec-Editor-Save (/admin/product/components/[slug]) validiert damit die
// redaktionelle Datei mit EXAKT denselben Regeln wie das check-content-Gate.
export {
	checkContentData,
	validateContentRaw,
	EDITORIAL_FIELDS,
	KNOWN_KEYS
} from '../../../tooling/content-validation.mjs';
