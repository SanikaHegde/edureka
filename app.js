const express = require('express');
                const Trie = require('./trie');
    
                const app = express();
                const trie = new Trie();
    
                app.use(express.json());
    
                app.get('/add-word', (req, res) => {
                    const { word } = req.query;
                    trie.insert(word.toLowerCase());
                    res.status(200).json({ message: `Word "${word}" added to dictionary` });
                });
    
                app.get('/spell-check', (req, res) => {
                    const word = req.query.word.toLowerCase();
                    const exists = trie.search(word);
                    res.status(200).json({ word: req.params.word, exists });
                });
    
                app.get('/autocomplete', (req, res) => {
                    const prefix = req.query.prefix.toLowerCase();
                    const suggestions = trie.autocomplete(prefix);
                    res.status(200).json({ prefix: req.params.prefix, suggestions });
                });
    
                const PORT = process.env.PORT || 3000;
                app.listen(PORT, () => {
                    console.log(`Server running on port ${PORT}`);
                });
              