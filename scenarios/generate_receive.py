import random
import numpy

stock = "APPLE"

file = open("scenarios/receive/1000.txt", "w+")

t = 2 # no of traders, give initially same amount to all

n = 1000 # no of transactions
file.write(str(n + 2*t) + "\n")

no_of_tokens = n*n
no_of_stocks = n
for i in range(1, t+1):
    file.write("0 DEPOSIT 0 " + str(i) + " TOKENS " + str(no_of_tokens) + "\n")
    file.write("0 DEPOSIT 0 " + str(i) + " APPLE " + str(no_of_stocks) + "\n")

for i in range(n):
    trader = 1
    when = 0
    amount = 1
    price = 1
    file.write(str(when) + " SELL " + str(trader) + " APPLE " + str(amount) + " " + str(price) + "\n")