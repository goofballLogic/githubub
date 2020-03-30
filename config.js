function verify(config) {

    if(!config.token) throw new Error("Missing token - GITHUBUB_TOKEN (this should be your Github personal access token, stored as an environment variable)");
    if(!config.org) throw new Error("Missing organisation login - GITHUBUB_ORG (this should be the login of the Github Organisation to query)");
    console.log("Configuration verified");
    return config;

}

module.exports = verify({
    token: process.env["GITHUBUB_TOKEN"],
    org: process.env["GITHUBUB_ORG"]
});
