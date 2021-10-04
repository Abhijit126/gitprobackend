exports.getLanguages = (username, repoName)=> {
    return new Promise((resolve, reject) => {
        request.get(`https://api.github.com/repos/${username}/${repoName}/languages`, { headers: { "User-Agent": "Abhijit126" } }, (err, response, body) => {
            if(err) {
                reject(err);
            }
            resolve(JSON.parse(body));
        });
    });
}