# Pin the upstream image so the compiled node shape stays stable for the patch below.
FROM n8nio/n8n:2.13.4@sha256:ab216dc8d10d1940a07f41f04355011ab03d0dec1fc03d62d5db3fc1bad815f5

USER root

COPY ./scripts/patch-facebook-lead-ads-trigger.mjs /tmp/patch-facebook-lead-ads-trigger.mjs
RUN node /tmp/patch-facebook-lead-ads-trigger.mjs \
	/usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes/FacebookLeadAds/FacebookLeadAdsTrigger.node.js \
	&& rm /tmp/patch-facebook-lead-ads-trigger.mjs

WORKDIR /home/node/packages/cli
ENTRYPOINT []

COPY ./entrypoint.sh /
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
