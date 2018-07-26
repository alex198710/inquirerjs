'use strict';

const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const axios = require('axios');
const REST_COUNTRIES_URL = "https://restcountries.eu/rest/v2/name/";

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const questions = [
    {
        type: 'input',
        name: 'first_name',
        message: "What's your first name ?",
        default : this.appname
    },
    {
        type: 'autocomplete',
        name: "fruit",
        suggestOnly: false,
        message: 'What is your favorite fruit?',
        source: searchFood,
        pageSize: 4,
        validate: function(val) {
            return val ? true : 'Type something!';
        },
    },
    {
        type: 'autocomplete',
        name: "country",
        suggestOnly: false,
        message: 'What is your country?',
        source: searchCountry,
        pageSize: 7,
        validate: function(val) {
        return val ? true : 'Type something!';
    }
}];

function searchCountry(answers, input) {
    input = input || 'a';
    return new Promise(function(resolve) {
        axios.get(`${REST_COUNTRIES_URL}${input}`)
            .then(response => {
                let countries = response.data.map(c => c.name);
                let fuzzyResult = fuzzy.filter(input, countries);
                resolve(
                    fuzzyResult.map(function(el) {
                        return el.original;
                    })
                );
            })
            .catch(error => {
                resolve([]);
            });
    });
}

const foods = ['Apple', 'Orange', 'Banana', 'Kiwi', 'Lichi', 'Grapefruit'];

function searchFood(answers, input) {
    input = input || '';
    return new Promise(function(resolve) {
        setTimeout(function() {
            let fuzzyResult = fuzzy.filter(input, foods);
            resolve(
                fuzzyResult.map(function(el) {
                    return el.original;
                })
            );
        }, 100);
    });
}

inquirer.prompt(questions)
    .then(answers => {
    console.log("Hello ",  answers.first_name, ", so you liked", answers.fruit, " you came from " + answers.country);
});