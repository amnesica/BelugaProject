package com.amnesica.belugaproject.utils;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.stream.ChunkedWriteHandler;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class TestNettyWebSocketServer {
  private final int port;
  private final String path;
  public Channel serverChannel;
  private final AtomicReference<Channel> clientChannelRef = new AtomicReference<>();
  private final CountDownLatch clientConnectedLatch = new CountDownLatch(1);

  public TestNettyWebSocketServer(int port, String path) {
    this.port = port;
    this.path = path;
  }

  public void start() throws InterruptedException {
    EventLoopGroup bossGroup = new NioEventLoopGroup(1);
    EventLoopGroup workerGroup = new NioEventLoopGroup();
    ServerBootstrap b = new ServerBootstrap();

    b.group(bossGroup, workerGroup)
        .channel(NioServerSocketChannel.class)
        .childHandler(new ChannelInitializer<SocketChannel>() {
          @Override
          protected void initChannel(SocketChannel ch) {
            ChannelPipeline p = ch.pipeline();
            p.addLast(new HttpServerCodec());
            p.addLast(new HttpObjectAggregator(65536));
            p.addLast(new ChunkedWriteHandler());
            p.addLast(new WebSocketServerProtocolHandler(path));
            p.addLast(new SimpleChannelInboundHandler<TextWebSocketFrame>() {
              @Override
              protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame msg) {
                ctx.channel().writeAndFlush(new TextWebSocketFrame(msg.text()));
              }

              @Override
              public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
                if (evt == WebSocketServerProtocolHandler.ServerHandshakeStateEvent.HANDSHAKE_COMPLETE) {
                  clientChannelRef.set(ctx.channel());
                  clientConnectedLatch.countDown(); // client connected
                }
                super.userEventTriggered(ctx, evt);
              }

              @Override
              public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
                if (clientChannelRef.get() == ctx.channel()) {
                  clientChannelRef.compareAndSet(ctx.channel(), null);
                }
                super.handlerRemoved(ctx);
              }
            });
          }
        });

    ChannelFuture f = b.bind(port).sync();
    serverChannel = f.channel();
  }

  public void sendToWebSocket(String message) {
    Channel ch = clientChannelRef.get();
    if (ch != null && ch.isActive()) {
      ch.writeAndFlush(new TextWebSocketFrame(message));
    } else {
      throw new IllegalStateException("No connected WebSocket client.");
    }
  }

  public boolean waitForClientConnected(long timeout, TimeUnit unit) throws InterruptedException {
    return clientConnectedLatch.await(timeout, unit);
  }

  public void stop() throws InterruptedException {
    if (serverChannel != null) {
      serverChannel.close().sync();
    }
  }
}
