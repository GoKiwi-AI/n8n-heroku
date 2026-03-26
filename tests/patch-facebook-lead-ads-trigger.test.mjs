import assert from 'node:assert/strict';
import test from 'node:test';
const scriptUrl = new URL('../scripts/patch-facebook-lead-ads-trigger.mjs', import.meta.url);

let patchFacebookLeadAdsTrigger = (source) => source;

try {
	({ patchFacebookLeadAdsTrigger } = await import(scriptUrl.href));
} catch {}

const compiledNodeFixture = `"use strict";
class FacebookLeadAdsTrigger {
    description = {
        displayName: 'Facebook Lead Ads Trigger',
        properties: [
            {
                displayName: 'Page',
                name: 'page',
                type: 'resourceLocator',
                default: { mode: 'list', value: '' },
                required: true,
                description: 'The page linked to the form for retrieving new leads',
            },
            {
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
        ],
    };
    async webhook() {
        const pageId = this.getNodeParameter('page', '', { extractValue: true });
        const formId = this.getNodeParameter('form', '', { extractValue: true });
        const events = await Promise.all(bodyData.entry
            .map((entry) => entry.changes
            .filter((change) => change.field === 'leadgen' &&
            change.value.page_id === pageId &&
            change.value.form_id === formId)
            .map((change) => change.value))
            .flat());
    }
}`;

test('removes the form selector and form_id filter from the compiled node', () => {
	const patchedSource = patchFacebookLeadAdsTrigger(compiledNodeFixture);

	assert.doesNotMatch(patchedSource, /displayName: 'Form'/);
	assert.doesNotMatch(patchedSource, /const formId = this\.getNodeParameter\('form'/);
	assert.doesNotMatch(patchedSource, /change\.value\.form_id === formId/);
	assert.match(
		patchedSource,
		/description: 'The page to monitor for retrieving new leads across all forms'/,
	);
});

test('fails fast when the upstream compiled node shape changes', () => {
	assert.throws(
		() => patchFacebookLeadAdsTrigger('const unrelated = true;'),
		/Unable to apply Facebook Lead Ads Trigger patch/,
	);
});
