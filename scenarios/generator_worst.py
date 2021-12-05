import random
import numpy

stock = "APPLE"

file = open("scenarios/receive/5000_spaced.txt", "w+")

t = 2 # no of traders, give initially same amount to all

n = 5000 # no of transactions
file.write(str(n + 2*t) + "\n")

no_of_tokens = n*n
no_of_stocks = n
for i in range(1, t+1):
    file.write("0 DEPOSIT 0 " + str(i) + " TOKENS " + str(no_of_tokens) + "\n")
    file.write("0 DEPOSIT 0 " + str(i) + " APPLE " + str(no_of_stocks) + "\n")

RECEIVE  = 20000
PAUSE = 10000

TOTAL = RECEIVE + PAUSE

batch = n
rounds = n / batch
half = rounds / 2
EPS = RECEIVE / 10

for i in range(rounds):

    rata  = (RECEIVE - 2*EPS) / batch
    whens = [i*TOTAL + EPS + rata*j for j in range(batch)]
    # whens.sort()

    for j in range(batch):
        trader = 1
        amount = 1
        price = 1
        file.write(str(whens[j]) + " SELL " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")

# for i in range(half):
#     for j in range(batch):
#         trader = 1
#         when = random.randint(i * TOTAL + EPS, i * TOTAL + RECEIVE - EPS)
#         amount = 1
#         price = 1
#         file.write(str(when) + " SELL " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")
    
# for i in range(half, rounds):
#     for j in range(batch):
#         trader = 2
#         when = random.randint(i * TOTAL + EPS, i * TOTAL + RECEIVE - EPS)
#         amount = 1
#         price = 1
#         file.write(str(when) + " BUY " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")