var React = require('react')
var ReactNative = require('react-native')
var htmlparser = require('./vendor/htmlparser2')
var entities = require('./vendor/entities')

var {
  Text,
  View
} = ReactNative

var LINE_BREAK = '\n'
var PARAGRAPH_BREAK = '\n\n'
var BULLET = '\u2022 '

function htmlToElement(rawHtml, opts, done) {
  function domToElement(dom, parent) {
    if (!dom) {
      return null;
    }
    // console.log('dom.length = ', dom.length);
    return dom.map((node, index, list) => {
      // console.log('dom map node.name = ', node.name);
      if (opts.customRenderer) {
        var rendered = opts.customRenderer(node, index, list)
        if (rendered || rendered === null) {
          // console.log('doing customRenderer return stuff for node.name', node.name, 'node.type = ', node.type);
          return rendered;
        }
      }

      if (node.type == 'text') {
        return (
          <Text key={index} style={parent ? opts.styles[parent.name] : null}>
            {entities.decodeHTML(node.data)}
          </Text>
        )
      }

      if (node.type == 'tag') {
        var linkPressHandler = null
        if (node.name == 'a' && node.attribs && node.attribs.href) {
          linkPressHandler = () => opts.linkHandler(entities.decodeHTML(node.attribs.href))
        }
        // NOTE: below code assumes that there will never be nested li or nested p tags
        return (
          <View key={index} onPress={linkPressHandler}>
            {(() => {
              if (node.name === 'li') {
                return (<Text>{BULLET} {domToElement(node.children, node)}</Text>);
              }
              if(node.name === 'p') {
                return (
                  <Text>
                    {domToElement(node.children, node)}
                  </Text>
                );
              }
              return domToElement(node.children, node);
            })()}
          </View>
        )
      }
    })
  }

  var handler = new htmlparser.DomHandler(function(err, dom) {
    if (err) {
      console.log('domHandler : err = ', err);
      done(err)
    }
    done(null, domToElement(dom))
  })
  var parser = new htmlparser.Parser(handler)
  parser.write(rawHtml)
  parser.done()
}

module.exports = htmlToElement;
