// Seleciona os elementos do DOM
const searchInput = document.getElementById('search-input');
const pokedexContainer = document.getElementById('pokedex-container');
const loader = document.getElementById('loader');
const modalContainer = document.getElementById('modal-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const typeFilter = document.getElementById('type-filter');
const colorFilter = document.getElementById('color-filter');
const sortBy = document.getElementById('sort-by');
const sortOrderBtn = document.getElementById('sort-order-btn');
const heroContainer = document.getElementById('hero-container');
const enterBtn = document.getElementById('enter-btn');

// Configurações
const totalPokemons = 151;
let allPokemonsData = []; // Array para armazenar todos os dados dos Pokémon
let sortOrder = 'asc'; // 'asc' ou 'desc'

const pokemonTypes = [
    'grass', 'fire', 'water', 'bug', 'normal', 'poison', 'electric',
    'ground', 'fairy', 'fighting', 'psychic', 'rock', 'ghost', 'ice', 'dragon'
];

const pokemonColors = [
    'black', 'blue', 'brown', 'gray', 'green',
    'pink', 'purple', 'red', 'white', 'yellow'
];

/**
 * Busca os dados de um Pokémon e retorna o objeto JSON.
 * @param {string|number} idOrName - O ID ou nome do Pokémon.
 * @returns {Promise<object|null>}
 */
const fetchPokemonData = async (idOrName) => {
    try {
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
        if (!pokemonRes.ok) return null;
        const pokemonData = await pokemonRes.json();

        // Fetch species data to get the color
        const speciesRes = await fetch(pokemonData.species.url);
        if (speciesRes.ok) {
            const speciesData = await speciesRes.json();
            pokemonData.color = speciesData.color.name;
        }

        return pokemonData;
    } catch (error) {
        console.error(`Erro ao buscar dados para ${idOrName}:`, error);
        return null;
    }
};

/**
 * Função principal que busca TODOS os Pokémon e os armazena.
 */
const fetchAllPokemons = async () => {
    try {
        const promises = [];
        for (let i = 1; i <= totalPokemons; i++) {
            promises.push(fetchPokemonData(i));
        }

        allPokemonsData = (await Promise.all(promises)).filter(p => p); // Filtra nulos

        // Remove o loader inicial se ele ainda estiver lá
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }

        applyFiltersAndRender();
    } catch (error) {
        console.error("Falha ao buscar Pokémon:", error);
        pokedexContainer.innerHTML = '<p class="error-message">Could not load Pokémon.</p>';
    }
};

/**
 * Aplica os filtros e a ordenação atuais e renderiza os Pokémon.
 */
const applyFiltersAndRender = () => {
    let filteredPokemons = [...allPokemonsData];

    // 1. Filtro por nome (busca)
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredPokemons = filteredPokemons.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    // 2. Filtro por tipo
    const selectedType = typeFilter.value;
    if (selectedType !== 'all') {
        filteredPokemons = filteredPokemons.filter(p => 
            p.types.some(typeInfo => typeInfo.type.name === selectedType)
        );
    }
    
    // 3. Filter by color
    const selectedColor = colorFilter.value;
    if (selectedColor !== 'all') {
        filteredPokemons = filteredPokemons.filter(p => p.color === selectedColor);
    }

    // 4. Sorting
    sortPokemons(filteredPokemons, sortBy.value);

    renderPokemons(filteredPokemons);
};

/**
 * Cria o elemento HTML (card) para um Pokémon e o insere na página.
 * @param {object} pokemonData - O objeto com os dados do Pokémon.
 */
const createPokemonCard = (pokemonData) => {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');

    const primaryType = pokemonData.types[0].type.name;
    card.classList.add(`type-bg-${primaryType}`);

    const name = pokemonData.name;
    const id = pokemonData.id.toString().padStart(3, '0');
    const imageUrl = pokemonData.sprites.front_default;
    
    const types = pokemonData.types.map(typeInfo => typeInfo.type.name);
    const typeHtml = types.map(type => `<span class="type ${type}">${type}</span>`).join('');

    // O card agora tem uma face frontal e uma traseira para a animação
    card.innerHTML = `
        <div class="card-face card-face-front">
            <span class="pokemon-id">#${id}</span>
            <img src="${imageUrl}" alt="${name}">
            <h2 class="pokemon-name">${name}</h2>
            <div class="pokemon-type">
                ${typeHtml}
            </div>
        </div>
        <div class="card-face card-face-back"></div>
    `;

    card.addEventListener('click', () => {
        card.classList.add('is-flipped'); // Ativa a animação de virar
        // Mostra o modal após a animação de virada (600ms)
        setTimeout(() => showPokemonDetails(pokemonData), 300);
    });
    pokedexContainer.appendChild(card);
};

/**
 * Limpa o container e renderiza a lista de Pokémon fornecida.
 * @param {Array} pokemonsToRender 
 */
const renderPokemons = (pokemonsToRender) => {
    pokedexContainer.innerHTML = '';
    if (pokemonsToRender.length === 0) {
        pokedexContainer.innerHTML = '<p class="error-message">No Pokémon found.</p>';
        return;
    }
    pokemonsToRender.forEach(createPokemonCard);
};

/**
 * Ordena um array de Pokémon com base no critério selecionado.
 * @param {Array} pokemonArray 
 * @param {string} criteria 
 */
const sortPokemons = (pokemonArray, criteria) => {
    switch (criteria) {
        case 'name':
            pokemonArray.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'height':
            pokemonArray.sort((a, b) => b.height - a.height);
            break;
        case 'weight':
            pokemonArray.sort((a, b) => b.weight - a.weight);
            break;
        case 'id':
        default:
            pokemonArray.sort((a, b) => a.id - b.id);
            break;
    }

    // Inverte a ordem se necessário
    if (sortOrder === 'desc') {
        pokemonArray.reverse();
    }
};

/**
 * Cria e exibe o modal com os detalhes do Pokémon.
 * @param {object} pokemonData - O objeto com os dados do Pokémon.
 */
const showPokemonDetails = async (pokemonData) => {
    const name = pokemonData.name;
    const id = pokemonData.id.toString().padStart(3, '0');
    const imageUrl = pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default;
    const types = pokemonData.types.map(typeInfo => typeInfo.type.name);
    const typeHtml = types.map(type => `<span class="type ${type}">${type}</span>`).join('');
    const weight = pokemonData.weight / 10;
    const height = pokemonData.height / 10;

    let description = "Loading description...";
    let evolutionsHtml = '<div class="evolution-chain"><p>Loading evolutions...</p></div>';

    const statsHtml = pokemonData.stats.map(statInfo => {
        const statName = statInfo.stat.name;
        const statValue = statInfo.base_stat;
        const barColor = statValue > 50 ? '#4caf50' : '#f44336';

        return `
            <div class="stat-item">
                <span class="stat-name">${statName}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${statValue}%; background-color: ${barColor};"></div>
                </div>
                <span class="stat-value">${statValue}</span>
            </div>
        `;
    }).join('');

    modalContainer.innerHTML = `
        <div class="pokemon-detail-card type-bg-${types[0]}">
            <button class="close-btn" onclick="closeModal()">X</button>
            <div class="detail-main">
                <div class="detail-left">
                    <img src="${imageUrl}" alt="${name}">
                    <div class="pokemon-info">
                        <p>Height: ${height} m</p>
                        <p>Weight: ${weight} kg</p>
                    </div>
                </div>
                <div class="detail-right">
                    <span class="pokemon-id">#${id}</span>
                    <h2 class="pokemon-name">${name}</h2>
                <div id="modal-genus" class="pokemon-genus"></div> <!-- Placeholder para o gênero -->
                    <div class="pokemon-type">${typeHtml}</div>
                    <p class="pokemon-description">${description}</p>
                </div>
            </div>
            <div class="detail-secondary">
                <div class="pokemon-stats">
                    <h3>Base Stats</h3>
                    ${statsHtml}
                </div>
                <div class="pokemon-fun-facts">
                    <h3>Fun Facts</h3>
                    <div id="modal-fun-facts">Loading...</div> <!-- Placeholder for fun facts -->
                </div>
                <div class="pokemon-evolutions">
                    <h3>Evolutions</h3>
                    ${evolutionsHtml}
                </div>
            </div>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    try {
        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();

        // Extrai as curiosidades
        const genusEntry = speciesData.genera.find(g => g.language.name === 'en');
        const genus = genusEntry ? genusEntry.genus : '';
        const isLegendary = speciesData.is_legendary;
        const isMythical = speciesData.is_mythical;

        // Atualiza o gênero
        const genusElement = modalContainer.querySelector('#modal-genus');
        if (genusElement) genusElement.textContent = genus;

        // Monta e atualiza as curiosidades
        let funFactsHtml = `<ul>`;
        if (isLegendary) funFactsHtml += `<li>This is a Legendary Pokémon!</li>`;
        if (isMythical) funFactsHtml += `<li>This is a Mythical Pokémon!</li>`;
        funFactsHtml += `<li>Base capture rate: ${speciesData.capture_rate}</li>`;
        funFactsHtml += `</ul>`;
        const funFactsElement = modalContainer.querySelector('#modal-fun-facts');
        if (funFactsElement) funFactsElement.innerHTML = funFactsHtml;

        const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'pt') || speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
        description = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f]/g, ' ') : 'Description not found.';

        const descriptionElement = modalContainer.querySelector('.pokemon-description');
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }

        const evolutionChainUrl = speciesData.evolution_chain.url;
        const evolutionChain = await fetchEvolutionChain(evolutionChainUrl);

        const evolutionDetails = await Promise.all(
            evolutionChain.map(pokemonName => fetchPokemonData(pokemonName))
        );

        const validEvolutionDetails = evolutionDetails.filter(p => p);

        evolutionsHtml = validEvolutionDetails.map((p, index) => {
            const evolutionItem = `
                <div class="evolution-item">
                    <img src="${p.sprites.front_default}" alt="${p.name}">
                    <span>${p.name}</span>
                </div>`;
            return index < validEvolutionDetails.length - 1 ? evolutionItem + '<span class="evolution-arrow">→</span>' : evolutionItem;
        }).join('');

        const evolutionContainer = modalContainer.querySelector('.pokemon-evolutions');
        if (evolutionContainer) {
            evolutionContainer.innerHTML = `
                <h3>Evolutions</h3>
                <div class="evolution-chain">${evolutionsHtml || '<p>This Pokémon has no evolutions.</p>'}</div>
            `;
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes adicionais:", error);
        const evolutionContainer = modalContainer.querySelector('.pokemon-evolutions');
        if (evolutionContainer) {
            evolutionContainer.innerHTML = '<h3>Evolutions</h3><p>Could not load evolutions.</p>';
        }
    }
};

/**
 * Busca e processa a cadeia de evolução de um Pokémon.
 * @param {string} evolutionChainUrl - A URL da cadeia de evolução.
 * @returns {Promise<string[]>} - Uma promessa que resolve para um array de nomes de Pokémon na cadeia.
 */
const fetchEvolutionChain = async (evolutionChainUrl) => {
    const evolutionResponse = await fetch(evolutionChainUrl);
    const evolutionData = await evolutionResponse.json();

    const chain = [];
    let current = evolutionData.chain;
    while (current) {
        chain.push(current.species.name);
        current = current.evolves_to[0];
    }
    return chain;
};

/**
 * Fecha o modal de detalhes.
 */
const closeModal = () => {
    modalContainer.classList.add('hidden');
    // "Desvira" todos os cards quando o modal é fechado
    const flippedCards = document.querySelectorAll('.pokemon-card.is-flipped');
    flippedCards.forEach(card => {
        card.classList.remove('is-flipped');
    });
};

/**
 * Popula o dropdown de tipos.
 */
const populateTypeFilter = () => {
    pokemonTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeFilter.appendChild(option);
    });
};

/**
 * Populates the color filter dropdown.
 */
const populateColorFilter = () => {
    pokemonColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
        colorFilter.appendChild(option);
    });
};

// --- Event Listeners ---

// Evento para o botão de entrar na Hero Page
enterBtn.addEventListener('click', () => {
    heroContainer.classList.add('hidden');
    populateTypeFilter();
    populateColorFilter();
    fetchAllPokemons();
});

// Eventos para os filtros e busca
searchInput.addEventListener('input', applyFiltersAndRender);
typeFilter.addEventListener('change', applyFiltersAndRender);
colorFilter.addEventListener('change', applyFiltersAndRender);
sortBy.addEventListener('change', applyFiltersAndRender);

sortOrderBtn.addEventListener('click', () => {
    // Inverte a ordem e reaplica os filtros
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    applyFiltersAndRender();
});

// Evento para fechar o modal ao clicar no fundo
modalContainer.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        closeModal();
    }
});
