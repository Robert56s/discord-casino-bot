const axios = require('axios')

class randomOrg {

    constructor(key) {
        this.apiKey = key
        this.echo = () => console.log(this.apiKey)

        this.getAuth = () => (this.login && this.password ? {login: this.login, password: this.password} : "fail")
        this.getUsage = () => this.makeRequest("getUsage")

        this.generateSignedIntegers = (n, min, max, userData = null, replacement = true, base = 10) => this.generateIntegers(n, min, max, replacement, base, userData, true)
        this.generateSignedIntegerSequences = (n, length, min, max, userData = null, replacement = true, base = 10) => this.generateIntegerSequences(n, length, min, max, replacement, base, userData, true)
        this.generateSignedDecimalFractions = (n, decimalPlaces, userData = null, replacement = true) => this.generateDecimalFractions(n, decimalPlaces, replacement, userData, true)
        this.generateSignedGaussians = (n, mean, standardDeviation, significantDigits, userData = null) => this.generateGaussians(n, mean, standardDeviation, significantDigits, userData = null, true)
        this.generateSignedStrings = (n, length, characters, userData = null, replacement = true) => this.generateStrings(n, length, characters, replacement, userData, true)
        this.generateSignedUUIDs = (n, userData = null) => this.generateUUIDs(n, userData, true)
        this.generateSignedBlobs = (n, size, userData = null, format = "base64") => this.generateBlobs(n, size, format, userData, true)

        this.delegationAdded = (serviceId, delegatorId, delegateId, delegationKey, handlerSecret) => this.delegationNotification(serviceId, delegatorId, delegateId, delegationKey, handlerSecret)
        this.delegationRemoved = (serviceId, delegatorId, delegateId, delegationKey, handlerSecret) => this.delegationNotification(serviceId, delegatorId, delegateId, delegationKey, handlerSecret)
    }


    async makeRequest(method, params = {}) {
        params.apiKey = this.apiKey
        const resp = await axios({
            method: 'POST',
            url: "https://api.random.org/json-rpc/2/invoke",
            data: JSON.stringify({
                jsonrpc: "2.0",
                method,
                params,
                id: 1
            }),
            headers: {'Content-Type': 'application/json; charset=utf-8'}
        })
        return resp.data
    }

    setAuth(login, password) {
        this.login = login
        this.password = password
    }

    // Basic

    generateIntegers(n, min, max, replacement = true, base = 10, userData = null,  signed = false) {
        if (min >= max)
          return Promise.reject(new Error("Min must be less than max."))
        else {
            let data = {
                n,
                min,
                max,
                replacement,
                base,
            }
            if (signed) data.userData = userData 
            return this.makeRequest(`generate${signed ? "Signed" : ""}Integers`, data)
        }
    }

    generateIntegerSequences(n, length, min, max, replacement = true, base = 10, userData = null, signed = false) {
        if (min >= max)
            return Promise.reject(new Error("Min must be less than max."))
        else if (n < 1 || n > 1000)
            return Promise.reject(new Error("N must be within the [1, 1000] range."))
        else {
            let data = {
                n,
                length,
                min,
                max,
                replacement,
                base
            }
            if (signed) data.userData = userData
            return this.makeRequest(`generate${signed ? "Signed" : ""}IntegerSequences`, data)
        }
    }

    generateDecimalFractions(n, decimalPlaces, replacement = true, userData = null, signed = false) {
        if (n < 1 || n > 10000)
            return Promise.reject(new Error("N must be within the [1, 10000] range."))
        else if (decimalPlaces < 1 || decimalPlaces > 14)
            return Promise.reject(new Error("Decimal Places must be within the [1, 14] range."))
        else {
            let data = {
                n,
                decimalPlaces,
                replacement
            }
            if (signed) data.userData = userData
            return this.makeRequest(`generate${signed ? "Signed" : ""}DecimalFractions`, data)
        }
    }

    generateGaussians(n, mean, standardDeviation, significantDigits, userData = null, signed = false) {
        if (n < 1 || n > 10000)
            return Promise.reject(new Error("N must be within the [1, 10000] range."))
        else if (mean < -1000000 || mean > 1000000)
            return Promise.reject(new Error("Mean must be within the [-1000000, 1000000] range."))
        else if (standardDeviation < -1000000 || standardDeviation > 1000000)
            return Promise.reject(new Error("Standard Deviation must be within the [-1000000, 1000000] range."))
        else if (significantDigits < 2 || significantDigits > 14)
            return Promise.reject(new Error("Significant Digits must be within the [2, 14] range."))
        else {
            let data = {
                n,
                mean,
                standardDeviation,
                significantDigits
            }
            if (signed) data.userData = userData
            return this.makeRequest(`generate${signed ? "Signed" : ""}Gaussians`, data)
        }
    }

    generateStrings(n, length, characters, replacement = true, userData = null, signed = false) {
        if (n < 1 || n > 10000)
            return Promise.reject(new Error("N must be within the [1, 10000] range."))
        else if (length < 1 || length > 10000)
            return Promise.reject(new Error("Length must be within the [1, 10000] range."))
        else if (characters.length > 128) {
            return Promise.reject(new Error("The maximum number of characters is 128."))
        }
        else {
            let data = {
                n,
                length,
                characters,
                replacement
            }
            if (signed) data.userData = userData
            return this.makeRequest(`generate${signed ? "Signed" : ""}Strings`, data)
        }
    }

    generateUUIDs(n, userData = null, signed = false) {
        if (n < 1 || n > 1000)
            return Promise.reject(new Error("N must be within the [1, 1000] range."))
        else {
            let data = {n}
            if (signed) data.userData = userData
            return this.makeRequest("generateUUIDs", data)
        }
    }

    generateBlobs(n, size, format = "base64", userData = null, signed = false) {
        if (n < 1 || n > 100)
            return Promise.reject(new Error("N must be within the [1, 100] range."))
        else {
            let data = {
                n,
                size,
                format
            }
            if (signed) data.userData = userData
            return this.makeRequest(`generate${signed ? "Signed" : ""}Blobs`, data)
        }
    }

    getResult(serialNumber) {
        return this.makeRequest("getResult", { serialNumber })
    }

    verifySignature(random, signature) {
        return this.makeRequest("verifySignature", {
            random,
            signature
        })
    }

    // Delegation

    addDelegation(serviceId, delegateId, notifyDelegate = true) {
        let credentials = this.getAuth()
        if (credentials != "fail")
            return this.makeRequest("addDelegation", {
                credentials,
                serviceId,
                delegateId,
                notifyDelegate
            })
        else Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    removeDelegation(delegationKey, notifyDelegate = true) {
        let credentials = this.getAuth()
        if (credentials != "fail")
            return this.makeRequest("removeDelegation", {
                credentials,
                delegationKey,
                notifyDelegate  
            })
        else Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    listDelegations() {
        let credentials = this.getAuth()
        if (credentials != "fail")
            return this.makeRequest("listDelegations", { credentials })
        else Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    setNotificationHandler(handlerUrl, handlerSecret) {
        let credentials = this.getAuth()
        if (credentials != "fail")
            return this.makeRequest("setNotificationHandler", {
                credentials,
                handlerUrl,
                handlerSecret
            })
        else Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    delegationNotification(serviceId, delegatorId, delegateId, delegationKey, handlerSecret) {
        return this.makeRequest("delegationAdded", {
            serviceId,
            delegatorId,
            delegateId,
            delegationKey,
            handlerSecret
        })
    }

    // Draw service

    holdDraw(title, recordType, entries, entriesDigest, winnerCount, entryType = "opaque", identicalEntriesPermitted = false, winnerStart = 1, winnerHandling = "remove", showEntries = true, showWinners = true, delegationKey = null) {
        const credentials = this.getAuth()
        if (credentials != "fail"){ 
            return this.makeRequest("holdDraw", {
                title,
                recordType,
                entries,
                entriesDigest,
                winnerCount,
                entryType,
                identicalEntriesPermitted,
                winnerStart,
                winnerHandling,
                showEntries,
                showWinners,
                delegationKey
            })
        }
        else 
            return Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    getDraw(drawId, maxEntries = 3000000, delegationKey = null) {
        let credentials =  this.getAuth()
        return this.makeRequest("getDraw", {
            drawId,
            maxEntries,
            credentials: credentials != "auth" ? credentials : null,
            delegationKey
        })
    }

    listDraws(delegationKey = null) {
        let credentials = this.getAuth()
        if (credentials != "auth") 
            return this.makeRequest("listDraws", { credentials, delegationKey })
        else 
            return Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    // Giveaway system

    beginGiveaway(description, entries, entriesDigest, rounds, delegationKey = null) {
        let credentials = this.getAuth()
        if (credentials != "auth") 
            return this.makeRequest("beginGiveaway", {
                credentials,
                description, 
                entries, 
                entriesDigest, 
                rounds,
                delegationKey
            })
        else 
            return Promise.reject(new Error("Enter credentials. (setAuth())"))
    }
    
    continueGiveaway(giveawayKey, delegationKey = null) {
        let credentials = this.getAuth()
        if (credentials != "auth") 
            return this.makeRequest("continueGiveaway", {
                credentials,
                giveawayKey,
                delegationKey
            })
        else 
            return Promise.reject(new Error("Enter credentials. (setAuth())"))
    }

    getGiveaway(giveawayKey) {
        return this.makeRequest("getGiveaway", { giveawayKey })
    }
    
    listGiveaways(delegationKey = null) {
        let credentials = this.getAuth()
        if (credentials != "auth") 
            return this.makeRequest("listGiveaways", {
                credentials,
                delegationKey
            })
        else 
            return Promise.reject(new Error("Enter credentials. (setAuth())"))
    }
}

module.exports = { randomOrg }