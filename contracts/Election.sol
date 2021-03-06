pragma solidity ^0.5.0;

contract Election {
    // Constr
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(address => bool) public voters;
    mapping(uint => Candidate) public candidates;

    uint public candidatesCount;

    event votedEvent (
            uint indexed _candidateId
    );

    constructor () public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    // adauga in baza
    function addCandidate (string memory _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender], "dont vote twice please!!!");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount, "nu e valid");

        voters[msg.sender] = true;

        candidates[_candidateId].voteCount ++;

        emit votedEvent(_candidateId);

    }
}