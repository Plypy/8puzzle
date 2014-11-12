/**
 * Description: 8code
 * Author: Ply_py
 */
#include <iostream>
#include <fstream>
#include <string>
#include <cmath>
#include <climits>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <map>
#include <vector>
#include <queue>
#include <ctime>
#include <map>
#include <set>
#include <iomanip>
#include <algorithm>
using namespace std;

const int MAXN = 9;
const int MAXS = 370000;//9!

int fact[MAXN] = {1, 1, 2, 6, 24, 120, 720, 5040, 40320};

struct State {
    int pos[MAXN];
    int space;
};

int ham(int a, int b) {
    int ra = a/3;
    int ca = a%3;
    int rb = b/3;
    int cb = b%3;
    return abs(ra-rb)+abs(ca-cb);
}

int dist(const State &a, const State &b) {
    int ret = 0;
    int mem[9] = {0};
    for (int i = 0; i < MAXN; ++i) {
        mem[a.pos[i]] = i;
    }
    for (int i = 0; i < MAXN; ++i) {
        ret += ham(mem[b.pos[i]], i);
    }
    return ret;
}

int updateSpace(State &s) {
    for (int i = 0; i < MAXN; ++i) {
        if (0 == s.pos[i]) {
            return s.space = i;
        }
    }
    // we should never get here
    return -1;
}

// reverse-Cantor conversion
int getId(const State &s) {
    int ret = 0;
    bool used[MAXN] = {0};
    for (int i = 0; i < MAXN; ++i) {
        int ct = 0;
        for (int j = 0; j < s.pos[i]; ++j) {
            if (!used[j]) {
                ++ct;
            }
        }
        ret += ct*fact[MAXN-i-1];
        used[s.pos[i]] = true;
    }
    return ret;
}

// Cantor conversion
State getState(int id) {
    State ret;
    bool used[MAXN] = {0};
    for (int i = 0; i < MAXN; ++i) {
        int ct = id/fact[MAXN-i-1];
        id %= fact[MAXN-i-1];
        for (int j = 0; j < MAXN; ++j) {
            if (!used[j]) {
                if (0 == ct) {
                    ret.pos[i] = j;
                    used[j] = true;
                    break;
                }
                --ct;
            }
        }
    }
    updateSpace(ret);
    return ret;
}

// 0..3 stand for up, right, down and left respectively
bool manipulate(const State &s, int type, State &ns) {
    ns = State(s);
    int p = ns.space;
    switch (type) {
    case 0:
        if (p < 3) {
            return false;
        }
        swap(ns.pos[p], ns.pos[p-3]);
        break;
    case 1:
        if (2 == p%3) {
            return false;
        }
        swap(ns.pos[p], ns.pos[p+1]);
        break;
    case 2:
        if (p > 5) {
            return false;
        }
        swap(ns.pos[p], ns.pos[p+3]);
        break;
    case 3:
        if (0 == p%3) {
            return false;
        }
        swap(ns.pos[p], ns.pos[p-1]);
        break;
    }
    updateSpace(ns);
    return true;
}

void output(const State &s) {
    for (int i = 0; i < 3; ++i) {
        for (int j = 0; j < 3; ++j) {
            int p = i*3+j;
            printf("%d ", s.pos[p]);
        }
        puts("");
    }
}

struct QNode {
    int sid;
    int f;
    int dis;
    QNode() {}
    QNode(int s, int f, int d): sid(s), f(f), dis(d) {}
    bool operator<(const QNode &t) const {
        return f>t.f;
    }
};



int bestf[MAXS];
int pre[MAXS];
char act[MAXS];
bool outq[MAXS];
State S, T;

void walkback(int id) {
    if (pre[id]) {
        walkback(pre[id]);
    } else {
        return;
    }
    putchar(act[id]);
}

int getCount(const State &s) {
    int ret = 0;
    for (int i = 0; i < MAXN; ++i) {
        for (int j = i+1; j < MAXN; ++j) {
            if (s.pos[i] > s.pos[j]) {
                ++ret;
            }
        }
    }
    return ret;
}

bool check() {
    return (getCount(S)-getCount(T))%2 == 0;
}

// char mov[4] = {'d','l','u','r'};
char mov[4] = {'2', '3', '0', '1'};
void work() {
    memset(bestf, -1, sizeof(bestf));
    memset(pre, 0, sizeof(pre));
    memset(outq, 0, sizeof(outq));
    updateSpace(S);
    updateSpace(T);
    // if (!check()) {
    //     puts("unsolvable");
    //     return;
    // }

    int Sid = getId(S);
    int Tid = getId(T);
    bestf[Sid] = 0;
    priority_queue<QNode> que;
    que.push(QNode(Sid, dist(S, T), 0));
    bool flag = false;
    while (que.size()) {
        QNode tnode = que.top();
        que.pop();
        int tid = tnode.sid;

        if (outq[tid]) {
            continue;
        }
        outq[tid] = true;
        if (outq[Tid]) {
            flag = true;
            break;
        }
        State tstate = getState(tid);
        int tdis = tnode.dis;
        int ndis = tdis+1;

        for (int i = 0; i < 4; ++i) {
            State nstate;
            if (manipulate(tstate, i, nstate)) {
                int nid = getId(nstate);
                int nf = ndis+dist(nstate, T);
                if (-1 == bestf[nid] || nf < bestf[nid]) {
                    bestf[nid] = nf;
                    pre[nid] = tid;
                    act[nid] = mov[i];
                    que.push(QNode(nid, nf, ndis));
                }
            }
        }
    }
    if (flag) {
        walkback(Tid);
        puts("");
    } else {
        puts("unsolvable");
    }
}

bool load() {
    char str[20];
    scanf("%s", str);
    for (int i = 0; i < MAXN; ++i) {
        S.pos[i] = str[i]-'0';
    }
    for (int i = 0; i < MAXN; ++i) {
        T.pos[i] = i+1;
    }
    T.pos[8] = 0;
    return true;
}

int main() {
    load();
    work();
}
