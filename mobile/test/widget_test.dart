import 'package:flutter_test/flutter_test.dart';
import 'package:kings_fall_mobile/main.dart';

void main() {
  testWidgets('KingsFallApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KingsFallApp());
    expect(find.byType(KingsFallApp), findsOneWidget);
  });
}
