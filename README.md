# graphql-relay-intro
graphql-relay-intro

# GraphQL

GraphQL 是在 Facebook 内部应用多年的一套数据查询语言和 runtime.

GraphQL是一种用于描述复杂、嵌套的数据依赖的查询语句。它已经在Facebook的原生APP上使用了多年。
在服务器端，我们通过配置将GraphQL与底层的数据查询代码映射起来。这层配置使得GraphQL可以访问不同的底层存储系统。Relay使用GraphQL作为数据查询语句，但并不指定GraphQL的具体实现。

# Relay

Relay 是连接 GraphQL 和 React 的一座桥梁。不过，除了让 React 认识 GraphQL 服务器之外，它还做了什么呢？

Relay是Facebook在React.js Conf（2015年1月）上首次公开的一个新框架，用于为React应用处理数据层问题。

在Relay中，每个组件都使用一种叫做GraphQL的查询语句声明对数据的依赖。组件可以使用this.props访问获取到的数据。

开发者可以自由地组合React组件，而Relay负责把不同组件的数据查询语句（原文的query）集中高效地组织并处理，向组件提供精确粒度的数据（没有多余数据），当数据变化时通知相应组件更新，并在客户端维护一份包含所有数据的数据缓存store。

# Relay 怎么用？

Relay是根据在Facebook构建大型应用的经验而诞生的。我们的首要任务是让开发者能以符合直觉的方式构建正确、高性能的WEB应用。它的设计使得即使是大型团队也能以高度隔离的方式应对功能变更。获取数据、数据变更、性能，都是让人头痛的问题。Relay则致力于简化这些问题，把复杂的部分交给框架处理，让开发者更加专注于应用本身。

使用 Relay 是要侵入前后端的：

* 在后端你得通过 graphql-relay-js 让 GraphQL schema 更适合 Relay；
* 在前端再通过 react-relay 来配合 React。

# Relay 包括什么？

Relay 把关于数据获取的事情都接管过来，比如说请求异常，loading，请求排队，cache，获取分页数据。我这里重点讲一下以下几个方面：

### client-side cache

Relay 获取数据当然离不开 cache，可以看到 GraphQL 不再依赖 URL cache，而是按照 Graph 来 cache，最大的保证 cache 没有冗余，发最少的请求，我举一个例子：

比如下面这个请求：

    query { stories { id, text } }

如果利用 URL 请求（比如说浏览器的 cache），那么这个请求下次确实命中 cache 了，那么假如我还有一个请求是：

    query { story(id: "123") { id, text } }

看得出，下面这个请求获取的数据是上面请求的子集，这里有两个问题：

* 如果第一第二两个请求获取的数据不一致怎么办？
* 本来就是子集，为什么我还要发请求？

这两个想法催生出来了 GraphQL 的解决方案：按照 Graph 来 cache，也就是说子集不需要再发请求了，当然你也可以强制发请求来更新局部或者整个 cache。

具体做法是通过拍平数据结构（类似数据库的几个范式）来 cache 整个 Graph。

view 通过订阅他需要的每个 cache record 来更新，只要其中一个 record 更新了，也只有订阅了这个 record 的 view 才会得到更新。

最后，聊到修改，我们可以看到 mutation 有个反直觉的地方是请求的 query 里包括了需要获取的数据。为什么不直接返回你的修改影响的那些数据？ 因为服务端实现这个太复杂了，有的时候一个简单的修改会影响到非常多的后台数据，而很多数据 view 是不需要知道它变化了。

所以，Relay 团队最后选择的方案是，让客户端告诉服务器端你认为哪些数据你想重新获取。具体到实现，Relay 采用的方案是获取 cache 和 fat query 有交集的部分，这样既更新了 cache，而且不在 cache 里的也不会获取。

# Relay 的声明式数据获取

React 是按 Component 组织 view 的，最好的方式也是把 view 需要的数据写在 view。如果用常规的做法，view 负责自己的 Data-fetch，那么，由于 React 是一层一层的往里深入 Component 的，那么也就意味着每一层 Component 都自己发请求去了，是不可能做到用一个网络请求来获取所有数据的。

所以，Relay 通过抽象出一个 container 的概念，让每个模块提前声明自己需要的数据，Relay 会先遍历所有 container，组成 query tree，这样就达到了只使用一个网络请求的目的。

另外，通过声明式数据获取还可以更好的对组件约束，只能获取它声明的数据，并且 Relay 也可以做些验证。

# graphql-relay-js

在看一些 React 和 Relay 协作的例子时，经常发现这个库的存在，这个库到底是干什么的？

通过查看源码后发现，里面其实是各种 helper 方法，负责生成一些 GraphQL 的类，为什么需要这样做？其实，这是因为 Relay 提供的一些功能（比如 ID handling，分页）需要 GraphQL 服务器提供特定的代码结构。如果你要开发一个 GraphQL 的前端，就算它基于其他框架，基于其他语言，实现一个像 graphql-relay-js 所实现的 Relay-compliant 的 server 是很有帮助的，比如graphql-go/relay。

# babel-relay-plugin

Relay 的 container 依赖的数据资源是通过声明的，但客户端是不知道后端的数据结构的。为了让客户端了解整个后台结构，就要引入这个 bable 插件，这个插件通过读取服务端的 schema，就可以让客户端正确理解它所需要的资源在服务端是长什么样的。

# optimistic UI update

这里：

    <Relay.RootContainer
        Component={ProfilePicture}
        route={profileRoute}
        renderLoading={function() {
            return <div>Loading...</div>;
        }}
        renderFailure={function(error, retry) {
            return (
            <div>
                <p>{error.message}</p>
                <p><button onClick={retry}>Retry?</button></p>
            </div>
            );
        }}
    />

可以看到在 Relay 里可以很简单的处理请求整个请求过程中的 UI 变化。