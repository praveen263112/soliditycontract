const StarNotary = artifacts.require('StarNotary')

contract('StarNotary',accounts => {

    beforeEach(async function(){
        this.contract = await StarNotary.new({from:accounts[0]});
    })

    describe('can create a star',()=>{
        it('can create a star and get its properties',async function(){
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6",1,{from: accounts[0]})
            assert.deepEqual(await this.contract.tokenIdToStarInfo(1),["Praveen","New star","ra_12.5","dec_13.2","mag_14.6"])
        })

        it("new token minted for user",async function(){
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6",1,{from: accounts[0]})
            assert.equal(await this.contract.ownerOf(1), accounts[0])            
        })
    })

    describe('buying and selling stars',()=>{
        let user1 = accounts[0];
        let user2 = accounts[1];

        let starId = 1;
        let starPrice = web3.toWei(0.01,"ether")

        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", starId, {from: user1})    
        })

        it('user1 can put up their star for sale', async function(){
            assert.equal(await this.contract.ownerOf(starId),user1)
            await this.contract.putStarUpForSale(starId,starPrice,{from:user1})

            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        describe("user2 can buy a star that was put up for sale",()=>{
            
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() { 
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)

                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })
        })


    })
    
    describe("check if star with co-ordinates already notarized",()=>{
        let user1 = accounts[0];
        let user2 = accounts[1];

        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", 1, {from: user1})    
        })

        it("star with the given co-ordinate already notarized",async function(){
            assert.equal(await this.contract.checkIfStarExist("12.5","13.2","14.6"),false)
        })

    })

    describe("check if star properties can be retrieved with tokenid",()=>{
        let user1 = accounts[0];
        
        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", 1, {from: user1})    
        })

        it("properties can be retreived for the star created by user1",async function(){
            assert.deepEqual(await this.contract.tokenIdToStarInfo(1),["Praveen","New star","ra_12.5","dec_13.2","mag_14.6"])
        })

        it("user1 is the owner of token 1",async function(){
            assert.equal(await this.contract.ownerOf(1),user1)
        })
    })

    describe("can transfer token",()=>{

        let user1 = accounts[1]
        let user2 = accounts[2]

        let tokenId = 1
        
        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", tokenId, {from: user1}) 
            await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user1})
            
        })

        it('token has new owner', async function () { 
            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('only permissioned users can transfer tokens', async function() { 
            let randomPersonTryingToStealTokens = accounts[4]

            await expectThrow(this.contract.safeTransferFrom(user1, randomPersonTryingToStealTokens, tokenId, {from: randomPersonTryingToStealTokens}))
        })

    })


    describe("can grant approval to transfer",()=>{
        let user1 = accounts[0];
        let user2 = accounts[1];
        let tx;

        let tokenId = 1

        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", tokenId, {from: user1}) 
            tx = await this.contract.approve(user2, tokenId, {from: user1})
        })
        
        it('set user2 as an approved address', async function () { 
            assert.equal(await this.contract.getApproved(tokenId), user2)
        })

        it('user2 can now transfer', async function () { 
            await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user2})

            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('emits the correct event', async function () { 
            assert.equal(tx.logs[0].event, 'Approval')
        })
    })

    describe("can set an operator",()=>{
        let user1 = accounts[0];
        let user2 = accounts[1];
        let operator = accounts[3]
        
        let tx;

        let tokenId = 1

        beforeEach(async function () { 
            await this.contract.createStar("Praveen","New star","12.5","13.2","14.6", tokenId, {from: user1}) 
            tx = await this.contract.setApprovalForAll(operator, true, {from: user1})            
        })

        it('can set an operator', async function () { 
            assert.equal(await this.contract.isApprovedForAll(user1, operator), true)
        })

    })

})

var expectThrow = async function(promise) { 
    try { 
        await promise
    } catch (error) { 
        assert.exists(error)
        return
    }

    assert.fail('Expected an error but didnt see one!')
}