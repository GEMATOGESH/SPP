const jwt = require('jsonwebtoken');

const dataBase = require('./db.js');

const updateTokens = async function(id, login) {
    const access = jwt.sign({"id" : id}, 'smallSecret',
        {
            expiresIn: "10s",
        }
    );
    const refresh = jwt.sign({"id" : id}, 'biggestSecret',
        {
            expiresIn: "30s",
        }
    );
    tokens = { "access": access, "refresh": refresh };
    console.log("Generated tokens for " + id);
    await dataBase.dbUpdateToken(login, tokens["refresh"]);
    return tokens;
}

const checkToken = async function(refresh) {
    try {
        data = jwt.verify(refresh, "biggestSecret");
        console.log("Refresh alive");
        token_id = data["id"];
        user = await dataBase.dbGetLoginByToken(refresh);
        if (token_id == user["id"]) {
            tokens = await updateTokens(user["id"], user["login"]);
            return tokens;
        }
    }
    catch (rerror) {
        console.log("Refresh error: " + rerror);
        return false;
    }
}

module.exports = {
    updateTokens, checkToken
}