using Microsoft.Extensions.Configuration;
using Stripe;
using Xunit;

namespace SolutionForms.Tests
{
    public class Tests
    {
        [Fact]
        public void PassingTest()
        {
            var configuration = new ConfigurationBuilder().AddUserSecrets().Build();
            StripeConfiguration.SetApiKey(configuration["stripe-api-key"]);

            var planService = new StripePlanService();
            var customerService = new StripeCustomerService();
            var cardService = new StripeCardService();

            var testPlan = planService.Get("UnitTestPlan") ?? planService.Create(new StripePlanCreateOptions
                {
                    Id = "UnitTestPlan",
                    Amount = 31,
                    Currency = "usd",
                    Interval = "month",
                    IntervalCount = 1,
                    Name = "Test plan created from unit test"
                });
            var customer = customerService.Get("cus_8OFUUhfJqfAdm9") ?? customerService.Create(new StripeCustomerCreateOptions
                {
                    Email = "test@mail.com",
                    Description = "test customer description",
                    PlanId = testPlan.Id,
                    SourceCard = new SourceCard()
                });
            var card = cardService.Get(customer.Id, "card_187T8ILiuPyBUDeGL5nbR4PP") ?? cardService.Create(customer.Id, new StripeCardCreateOptions
                {
                    SourceCard = new SourceCard
                        {
                            Number = "4242424242424242",
                            ExpirationYear = "2022",
                            ExpirationMonth = "10",
                            AddressCountry = "US",                
                            AddressLine1 = "24 Beef Flank St",    
                            AddressLine2 = "Apt 24",              
                            AddressCity = "Biggie Smalls",        
                            AddressState = "NC",                  
                            AddressZip = "27617",                 
                            Name = "Joe Meatballs",               
                            Cvc = "1223"                            
                        }
                });

            Assert.NotNull(card);
        }
    }
}