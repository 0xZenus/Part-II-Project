import random
import numpy

stock = "APPLE"
miu_buy, miu_sell = 70, 80
sigma_buy, sigma_sell = 10, 10

file = open("scenarios/reliability.txt", "w+")

t = 5 # no of traders, give initially same amount to all

# reliability: 10 * 3600 * 8

rounds = 3600 * 8 / 15
batch = 100
n = rounds*batch # no of transactions
file.write(str(n+2*t) + "\n")

no_of_tokens = 10000*n
no_of_stocks = 100*n
for i in range(1, t+1):
    file.write("0 DEPOSIT 0 " + str(i) + " TOKENS " + str(no_of_tokens) + "\n")
    file.write("0 DEPOSIT 0 " + str(i) + " APPLE " + str(no_of_stocks) + "\n")

RECEIVE = 10000
PAUSE = 10000
TOTAL = RECEIVE + PAUSE
EPS_BEGIN = 1000
EPS_FINAL = 6000

for i in range(rounds):

    whens = [random.randint(i * TOTAL + EPS_BEGIN, i * TOTAL + RECEIVE - EPS_FINAL) for _ in range(batch)]
    whens.sort()

    for j in range(batch):
        trader = random.randint(1, t)
        type = random.randint(0, 1)
        if type == 0: # SELL
            amount = random.randint(5, 10)
            price = (int)(numpy.random.normal(miu_sell, sigma_sell))
            file.write(str(whens[j]) + " SELL " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")
        else: # BUY
            amount = random.randint(5, 10)
            price = (int)(numpy.random.normal(miu_buy, sigma_buy))
            file.write(str(whens[j]) + " BUY " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")
 