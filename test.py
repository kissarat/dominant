from json import loads, dumps
from random import sample, randint
from string import ascii_letters, digits
from unittest import TestCase
from urllib.request import urlopen
from re import split

alnum = ascii_letters + digits
alnum = list(alnum)


class ApiTest(TestCase):
    data = None

    def setUp(self):
        if not self.data:
            data = urlopen('https://www.gnu.org/licenses/gpl.txt').read()
            data = split(r"\.\s+", data.decode('ascii'))
            self.data = set(data)

    def test_message(self):
        s = sample(self.data, randint(1, 3))
        s = ". ".join(s)
        s = s[:256]
        path = '/' + ''.join(sample(alnum, randint(1, 8)))
        r = urlopen('http://localhost:8080' + path, s.encode('utf8')).read().decode('utf8')
        r = loads(r)
        messages = urlopen('http://localhost:8080' + path).read().decode('utf8')
        messages = loads(messages)
        if 'error' in messages:
            return print(dumps(messages['error']))
        for message in messages:
            if message['id'] == r['id']:
                self.assertEqual(s, message['text'])
                return
        self.fail("No message found")
