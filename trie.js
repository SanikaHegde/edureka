// trie.js
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    search(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) return false;
            node = node.children[char];
        }
        return node.isEndOfWord;
    }

    autocomplete(prefix) {
        let node = this.root;
        for (let char of prefix) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }
        return this._getWordsFromNode(node, prefix);
    }

    _getWordsFromNode(node, prefix) {
        let results = [];
        if (node.isEndOfWord) results.push(prefix);
        for (let char in node.children) {
            results = results.concat(this._getWordsFromNode(node.children[char], prefix + char));
        }
        return results;
    }
}

module.exports = Trie;