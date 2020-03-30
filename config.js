module.exports = {

    verify(config) {

        if(!config.token) throw new Error("Missing token -this should be your Github personal access token, stored as an environment variable");
        if(!config.org) throw new Error("Missing organisation login - this should be the login of the Github Organisation to query");
        return config;

    }

};