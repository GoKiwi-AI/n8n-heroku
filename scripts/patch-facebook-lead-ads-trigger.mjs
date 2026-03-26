import { readFile, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

const PATCH_ERROR_PREFIX = 'Unable to apply Facebook Lead Ads Trigger patch';

const PAGE_DESCRIPTION = "                description: 'The page linked to the form for retrieving new leads',\n";
const PAGE_DESCRIPTION_REPLACEMENT =
	"                description: 'The page to monitor for retrieving new leads across all forms',\n";

const FORM_PROPERTY = `            {
                displayName: 'Form',
                name: 'form',
                type: 'resourceLocator',
                default: { mode: 'list', value: '' },
                required: true,
                description: 'The form to monitor for fetching lead details upon submission',
                modes: [
                    {
                        displayName: 'From List',
                        name: 'list',
                        type: 'list',
                        typeOptions: {
                            searchListMethod: 'formList',
                        },
                    },
                    {
                        displayName: 'By ID',
                        name: 'id',
                        type: 'string',
                        placeholder: '121637951029080',
                    },
                ],
            },
`;

const FORM_PARAMETER =
	"        const formId = this.getNodeParameter('form', '', { extractValue: true });\n";

const FORM_FILTER = `            .filter((change) => change.field === 'leadgen' &&
            change.value.page_id === pageId &&
            change.value.form_id === formId)
`;

const FORM_FILTER_REPLACEMENT = `            .filter((change) => change.field === 'leadgen' &&
            change.value.page_id === pageId)
`;

const TYPES_PAGE_DESCRIPTION =
	'"description":"The page linked to the form for retrieving new leads"';
const TYPES_PAGE_DESCRIPTION_REPLACEMENT =
	'"description":"The page to monitor for retrieving new leads across all forms"';

const TYPES_FORM_PROPERTY =
	/,\{"displayName":"Form","name":"form","type":"resourceLocator","default":\{"mode":"list","value":""\},"required":true,"description":"The form to monitor for fetching lead details upon submission","modes":\[\{"displayName":"From List","name":"list","type":"list","typeOptions":\{"searchListMethod":"formList"\}\},\{"displayName":"By ID","name":"id","type":"string","placeholder":"121637951029080"\}\]\}/;

function replaceExactlyOnce(source, searchValue, replacementValue, label) {
	const occurrences = source.split(searchValue).length - 1;

	if (occurrences !== 1) {
		throw new Error(`${PATCH_ERROR_PREFIX}: expected 1 ${label} match, found ${occurrences}`);
	}

	return source.replace(searchValue, replacementValue);
}

function replaceExactlyOnceRegex(source, searchPattern, replacementValue, label) {
	const matches = source.match(new RegExp(searchPattern.source, searchPattern.flags.includes('g') ? searchPattern.flags : `${searchPattern.flags}g`)) ?? [];

	if (matches.length !== 1) {
		throw new Error(`${PATCH_ERROR_PREFIX}: expected 1 ${label} match, found ${matches.length}`);
	}

	return source.replace(searchPattern, replacementValue);
}

export function patchFacebookLeadAdsTrigger(source) {
	if (!source.includes("displayName: 'Facebook Lead Ads Trigger'")) {
		throw new Error(`${PATCH_ERROR_PREFIX}: expected the compiled Facebook Lead Ads Trigger source`);
	}

	let patchedSource = source;

	patchedSource = replaceExactlyOnce(
		patchedSource,
		PAGE_DESCRIPTION,
		PAGE_DESCRIPTION_REPLACEMENT,
		'page description',
	);
	patchedSource = replaceExactlyOnce(patchedSource, FORM_PROPERTY, '', 'form property block');
	patchedSource = replaceExactlyOnce(patchedSource, FORM_PARAMETER, '', 'form parameter read');
	patchedSource = replaceExactlyOnce(
		patchedSource,
		FORM_FILTER,
		FORM_FILTER_REPLACEMENT,
		'form_id filter',
	);

	return patchedSource;
}

export function patchFacebookLeadAdsTriggerTypes(source) {
	if (!source.includes('"name":"facebookLeadAdsTrigger"')) {
		throw new Error(`${PATCH_ERROR_PREFIX}: expected the compiled Facebook Lead Ads Trigger types`);
	}

	let patchedSource = source;

	patchedSource = replaceExactlyOnce(
		patchedSource,
		TYPES_PAGE_DESCRIPTION,
		TYPES_PAGE_DESCRIPTION_REPLACEMENT,
		'types page description',
	);
	patchedSource = replaceExactlyOnceRegex(
		patchedSource,
		TYPES_FORM_PROPERTY,
		'',
		'types form property block',
	);

	return patchedSource;
}

export async function patchFacebookLeadAdsTriggerFile(filePath) {
	const source = await readFile(filePath, 'utf8');
	let patchedSource;

	if (filePath.endsWith('/FacebookLeadAdsTrigger.node.js')) {
		patchedSource = patchFacebookLeadAdsTrigger(source);
	} else if (filePath.endsWith('/types/nodes.json')) {
		patchedSource = patchFacebookLeadAdsTriggerTypes(source);
	} else {
		throw new Error(`${PATCH_ERROR_PREFIX}: unsupported file path ${filePath}`);
	}

	if (patchedSource !== source) {
		await writeFile(filePath, patchedSource, 'utf8');
	}
}

const isCliEntrypoint = argv[1] === fileURLToPath(import.meta.url);

if (isCliEntrypoint) {
	const [, , filePath] = argv;

	if (!filePath) {
		throw new Error(`${PATCH_ERROR_PREFIX}: expected the compiled node file path as the first argument`);
	}

	await patchFacebookLeadAdsTriggerFile(filePath);
}
