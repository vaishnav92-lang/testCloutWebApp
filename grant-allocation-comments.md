## Original Google doc

Problem statement / deserata
Effort to write and evaluate detailed applications SFF asks for is significant, especially for individuals asking for small amounts of money
simplifying while retaining quality of evaluations is a win for the both parts of the system, freeing up effort to do more object level work and grantmaker time
Core Mechanism

Collect a distribution of trust (e.g. in research progress) from each applicant (and anyone else who wants to provide it). A set of numbers as trust allocations is fine, we just need to normalize to sum to 1 before using it.
Put it into a NxN matrix, which is equivalent to a directed weighted graph. Small example:


Select initial trusted node allocation (SFF regranters pick researchers they know are good, weighted by trust)
Run a process based on EigenTrust / PageRank, modified to have a starting set of trusted nodes and mitigate strategic allocation by eliminating cycles. This lets trust flow through the graph, allowing the trusted researcher’s existing in-depth knowledge of other less well-known researchers to allocate trust.
Applicants get a “total utility under the curve” equal to their allocated trust.
Packets of funding ($1k, like S-process) flow to the highest utility recipients.
Outputs a list of recommendations: Funders check over this and approve all that seem reasonable.

This means that the funding allocation system can use not just grantmakers knowledge of the best researchers and their scarce time, but also the existing knowledge of the researchers the recommenders trust. This lets you scale networks of trust and take lots of smaller bets.
Application format

List of links+descriptions of things you’ve done / written (plus short descriptions of your contribution if it was a shared project)
You can add in links to things you are thinking of doing, but these require write-ups and supporting evidence of you being able to do them
Distribution of trust to others, based on how much you have evidence that they’re doing good things
Interface is tag-adder with autocomplete and option to add new people by username/handle/name/email (unified in the backend).
Your own utility function over money.



## Response

Skype's peer-to-peer architecture is replicated in the S-process, to the extent that there are superpeers in Skype and recommenders in the S-process. In phase one of the application process, the set of grant applicants is collected, and vetted for basic fit. The point of this phase is to finalize an applicant cohort, and to discard spam and troll applications. In the second phase, the applicants and recommenders are combined into a pool and the membership of the pool is made public to the rest of the pool. The members are given an opportunity to tag predictions to any of the applicants or recommenders that they know. A prediction is a conditional statement about a person of the form "if ___, then ___", and it can be used to express trust. Some examples are "if you ask Jake about whether I am a good borrower, then he will tell you that I am", "if you give Cody a Leetcode medium, then he will figure it out on the spot, or after a hint", "if Mya wins a grant, she will post about it everywhere", and "if Vedant floats a job by you, then there is at least a 50% chance that it will result in a call being scheduled". Qualitatively negative predictions are not allowed to be submitted, since from the perspective of a trust network, not assigning trust should be made equivalent to assigning distrust, to prevent sabotage, fear, and other consequences of allowing people to say bad things about others. In the third phase, members of the cohort review the predictions made about the people they know, and they are allowed to reinforce them. Similar predictions are grouped, and users that made those predictions automatically reinforce each others' claims. Once again, negative reinforcement is not allowed, since from the perspective of the trust network, negative reinforcement should be assumed to be the more gentle alternative of no reinforcement -- if twelve people know Pauline, and none of the eleven backed a prediction about her, that should be enough signal to work with. Partitioning the prediction digraph into strongly connected components will likely reveal connected components that no recommender is connected to, but an appropriate algorithm will still find trusted applicants, both by the level of reinforcement of their predictions, as well as by the predictions made about them. CloutCareers will maintain the predictions and reinforcement signals, and reuse them across grant applications, as well as across the website, since users can use the predictions made about themselves and about others to engage in networking activities.




## Response to response

2. "In phase one of the application process, the set of grant applicants is collected, and vetted for basic fit." are you describing their process here or suggesting process for us to implement on their behalf?   3. "The members are given an opportunity to tag predictions to any of the applicants or recommenders that they know. A prediction is a conditional statement about a person of the form "if ___, then ___", and it can be used to express trust. Some examples are "if you ask Jake about whether I am a good borrower, then he will tell you that I am", "if you give Cody a Leetcode medium, then he will figure it out on the spot, or after a hint", "if Mya wins a grant, she will post about it everywhere", and "if Vedant floats a job by you, then there is at least a 50% chance that it will result in a call being scheduled"" - I understand what you're saying as it relates to recruiting. But we should think about what type of conditional statements we expect people to make in this specific grantmaking context? 4. I'm not sure SFF is looking for something this rich in context. Let me first get a better sense of what they have in mind, and once we grasp that completely, we can propose improvements.



## Response to response to response

2. This can be in-platform, we do everything described. 
3. Only the Vedant one is recruiting-specific.
4. Ok.




## Comments on Google doc

this is a closed and known pool of people, correct? 

If yes, do you also want the ability to source applicants from people in their extended networks?

Do we need to think about how to incentivize applicants to be honest about their outgoing distribution of trust?

Assume they know who the other applicants are as they fill out the application themselves?