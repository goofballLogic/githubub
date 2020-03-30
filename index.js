const https = require("https");
const { verify } = require("./config");
const { build } = require("./queries");

async function execute(config, query, variables) {

    const body = JSON.stringify({ query, variables });
    return await new Promise((resolve, reject) => {

        const headers = {
            "Authorization": `bearer ${config.token}`,
            "User-Agent": "githubub",
            "Content-Type": "application/json"
        };
        const req = https.request("https://api.github.com/graphql", { method: "POST", headers }, res => {
            res.on("error", reject);
            let data = "";
            res.on("data", chunk => data = data + chunk);
            res.on("end", () => resolve(JSON.parse(data)));
        });
        req.on("error", reject);
        req.end(body);

    });

}

const CHANGES_REQUESTED = "CHANGES_REQUESTED";
const APPROVED = "APPROVED";
const COMMENTED = "COMMENTED";
const DISMISSED = "DISMISSED";
const PENDING = "PENDING";

function calculateReviewState(reviews) {
    if (reviews.some(r => r.state === CHANGES_REQUESTED))
        return CHANGES_REQUESTED;
    if (reviews.some(r => r.state === APPROVED))
        return APPROVED;
    if (reviews.some(r => r.state === COMMENTED))
        return COMMENTED;
    if (reviews.some(r => r.state === DISMISSED))
        return DISMISSED;
    return PENDING;
}

function formatPR(node) {
    node = {
        ...node,
        reviews: (node.reviews && node.reviews.nodes) || [],
        reviewRequests: (node.reviewRequests && node.reviewRequests.nodes) || []
    };
    node.reviewState = calculateReviewState(node.reviews);
    return node;
}

module.exports = {

    async fetchPRs(config) {

        verify(config);
        const queries = await build();

        let variables = { organization_login: config.org };
        const repositories = [];
        let safety = 100;
        do {
            const query = queries["repos-with-prs"];
            const res = await execute(config, query, variables);
            if (res.errors) {
                console.error(JSON.stringify(res.errors, null, 3));
                throw new Error("Query failed");
            }
            const doc = res.data.organization.repositories;
            variables.repositories_after = doc.pageInfo.hasNextPage ? doc.pageInfo.endCursor : null;
            repositories.push(...doc.edges.map(e => e.node));
        } while (variables.repositories_after && --safety > 0)

        const prs = [];
        repositories.forEach(repo => {
            const nodes = repo.pullRequests.nodes;
            if (nodes.length) {
                prs.push(...nodes.map(node => ({
                    ...formatPR(node),
                    repo: { id: repo.id, name: repo.name }
                })));
            }
        });
        prs.sort((a, b) => a.createdAt > b.createdAt ? 1 : a.createdAt == b.createdAt ? 0 : -1);
        return prs;
    }
};

