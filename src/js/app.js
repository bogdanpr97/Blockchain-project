App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    console.log('init web');

    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545'
      );
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    console.log('init contr');
    $.getJSON('Election.json', function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
      App.listenForEvents();
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance
        .votedEvent(
          {},
          {
            fromBlock: 0,
            toBlock: 'latest'
          }
        )
        .watch(function(error, event) {
          console.log('event triggered', event);
          // Reload when a new vote is recorded
          App.render();
        });
    });
  },

  render: async function() {
    console.log('render');

    var electionInstance;
    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    // web3.eth.getCoinbase(function(err, account) {
    //   if (err === null) {
    //     console.log('count is ', account);
    //     App.account = account;
    //     $('#accountAddress').html('Your Account: ' + account);
    //   }
    // });

    // console.log('a1', accounts, 'a2', accounts2);
    // web3.eth.getAccounts(function(error, result) {
    //   console.log(result);
    // });
    web3.eth.getAccounts(function(error, accounts) {
      $('#accountAddress').html('Your Account: ' + accounts[0]);
    });

    // Load contract data
    App.contracts.Election.deployed()
      .then(function(instance) {
        console.log('instance is', instance);
        electionInstance = instance;
        return electionInstance.candidatesCount();
      })
      .then(function(candidatesCount) {
        console.log('count is', candidatesCount);

        var candidatesResults = $('#candidatesResults');
        candidatesResults.empty();

        var candidatesSelect = $('#candidatesSelect');
        candidatesSelect.empty();

        for (var i = 1; i <= candidatesCount; i++) {
          electionInstance.candidates(i).then(function(candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];

            // Render candidate Result
            var candidateTemplate =
              '<tr><th>' +
              id +
              '</th><td>' +
              name +
              '</td><td>' +
              voteCount +
              '</td></tr>';
            candidatesResults.append(candidateTemplate);

            // Render candidate ballot option
            var candidateOption =
              "<option value='" + id + "' >" + name + '</ option>';
            candidatesSelect.append(candidateOption);
          });
        }
        return electionInstance.voters(App.account);
      })
      .then(function(hasVoted) {
        // Do not allow a user to vote
        if (hasVoted) {
          $('form').hide();
        }
        loader.hide();
        content.show();
      })
      .catch(function(error) {
        console.warn(error);
      });
  },

  castVote: function() {
    console.log('cast');
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed()
      .then(function(instance) {
        console.log('instance', instance.vote);

        return instance.vote(candidateId, { from: App.account });
      })
      .then(function(result) {
        // Wait for votes to update
        $('#content').hide();
        $('#loader').show();
      })
      .catch(function(err) {
        console.error(err);
      });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
